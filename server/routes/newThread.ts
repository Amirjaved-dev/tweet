import express from 'express';
import { clerkAuth } from '../middleware/clerkAuth';
import { threadService } from '../services/threadService';
import { config } from '../config';

const router = express.Router();

// Generate Twitter thread with premium checks
router.post('/generate', clerkAuth, async (req, res) => {
  try {
    const { topic, tone, options } = req.body;
    const clerkUserId = req.clerkUserId!;

    if (!topic || !tone) {
      return res.status(400).json({ error: 'Missing required fields: topic and tone' });
    }

    // Check if user can create thread (handles premium vs free limits)
    const { canCreate, reason, isPremium } = await threadService.canCreateThread(clerkUserId);
    
    if (!canCreate) {
      return res.status(403).json({ 
        error: reason,
        isPremium,
        upgradeRequired: !isPremium
      });
    }

    // Process advanced options from frontend
    const advancedOptions = {
      wordCount: options?.wordCount || 'medium',
      audience: options?.audience || 'general',
      includeHashtags: options?.includeHashtags !== undefined ? options.includeHashtags : true,
      includeCTA: options?.includeCTA !== undefined ? options.includeCTA : true,
      includeEmojis: options?.includeEmojis !== undefined ? options.includeEmojis : true,
      includeStats: options?.includeStats !== undefined ? options.includeStats : false,
    };

    // Build enhanced prompt based on options
    let prompt = `Generate a Twitter thread about "${topic}" in a ${tone} tone.`;
    
    // Add word count guidance
    switch (advancedOptions.wordCount) {
      case 'short':
        prompt += ` Create approximately 5 tweets for a concise thread.`;
        break;
      case 'long':
        prompt += ` Create approximately 15 tweets for an in-depth thread.`;
        break;
      default: // medium
        prompt += ` Create approximately 10 tweets for a comprehensive thread.`;
    }

    // Add audience targeting
    switch (advancedOptions.audience) {
      case 'tech':
        prompt += ` Target tech-savvy professionals and developers. Use technical terminology appropriately.`;
        break;
      case 'business':
        prompt += ` Target business professionals and entrepreneurs. Focus on business value and ROI.`;
        break;
      case 'creators':
        prompt += ` Target content creators and influencers. Focus on engagement and community building.`;
        break;
      case 'finance':
        prompt += ` Target finance professionals and investors. Include market insights and data.`;
        break;
      default: // general
        prompt += ` Target a general audience. Keep language accessible and engaging.`;
    }

    // Add formatting instructions
    prompt += `\n\nFormatting requirements:`;
    prompt += `\n- Start with a compelling hook tweet`;
    prompt += `\n- Each tweet should be within 280 characters`;
    prompt += `\n- Number each tweet (1/X format)`;
    
    if (advancedOptions.includeHashtags) {
      prompt += `\n- Include relevant hashtags where appropriate`;
    }
    
    if (advancedOptions.includeEmojis) {
      prompt += `\n- Use emojis strategically to increase engagement`;
    }
    
    if (advancedOptions.includeCTA) {
      prompt += `\n- End with a clear call-to-action (follow, retweet, comment)`;
    }
    
    if (advancedOptions.includeStats) {
      prompt += `\n- Include relevant statistics or data points where possible`;
    }

    prompt += `\n\nDon't include any introductory text - just output the actual tweets, each separated by a double newline.`;

    // Check if OpenRouter API key is configured
    if (!config.openRouterApiKey) {
      console.error('Missing OpenRouter API key');
      return res.status(500).json({ error: 'API configuration error' });
    }

    try {
      // Generate thread content using AI
      let modelToUse = config.aiModel;
      let retryCount = 0;
      let maxRetries = 1;
      let threadContent;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Generating thread using model: ${modelToUse}`);
          
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Authorization': `Bearer ${config.openRouterApiKey}`,
              'HTTP-Referer': 'https://threadflowpro.app',
              'X-Title': 'ThreadFlow Pro'
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: [
                { 
                  role: 'system', 
                  content: `You are an expert Twitter thread creator specializing in ${advancedOptions.audience} content. You create engaging, informative Twitter threads that provide value to readers and drive engagement. You understand how to write for the ${tone} tone and adapt content for different audiences.` 
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: advancedOptions.wordCount === 'long' ? 2048 : (advancedOptions.wordCount === 'short' ? 512 : 1024)
            }),
          });

          const responseText = await response.text();
          console.log('Response status:', response.status);
          
          if (!responseText || responseText.trim() === '') {
            if (retryCount === 0) {
              console.log('Empty response. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Empty response from AI service');
            }
          }
          
          if (!response.ok) {
            console.error('OpenRouter API error:', responseText.substring(0, 200));
            
            if (retryCount === 0) {
              console.log('API error. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error(`AI service error: ${response.status}`);
            }
          }
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            if (retryCount === 0) {
              console.log('JSON parse error. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Invalid response from AI service');
            }
          }
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            if (retryCount === 0) {
              console.log('Invalid response format. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Invalid response format from AI service');
            }
          }
          
          threadContent = data.choices[0].message.content;
          break; // Successfully got a response
          
        } catch (error) {
          if (retryCount === 0) {
            console.error('Error with primary model, trying fallback:', error);
            modelToUse = config.fallbackAiModel;
            retryCount++;
            continue;
          } else {
            throw error;
          }
        }
      }

      // Add watermark for free users
      if (!isPremium) {
        threadContent += `\n\n🔍: Generated with ThreadNova Free. Upgrade for watermark-free threads!`;
      }
      
      // Create thread in database
      const thread = await threadService.createThread(clerkUserId, {
        content: threadContent,
        title: topic,
        metadata: {
          tone,
          options: advancedOptions,
          model: modelToUse,
          generated_at: new Date().toISOString()
        }
      });

      return res.status(200).json({ 
        thread,
        isPremium,
        dailyCount: thread.dailyCount
      });
      
    } catch (error) {
      console.error('Error calling AI service:', error);
      return res.status(500).json({ 
        error: 'Error generating thread content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error generating thread:', error);
    return res.status(500).json({ error: 'Error generating thread' });
  }
});

// Get user threads
router.get('/user', clerkAuth, async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const threads = await threadService.getUserThreads(clerkUserId, limit, offset);

    return res.status(200).json({ threads });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return res.status(500).json({ error: 'Error fetching threads' });
  }
});

// Get specific thread
router.get('/:id', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = req.clerkUserId!;

    if (!id) {
      return res.status(400).json({ error: 'Missing thread ID' });
    }

    const thread = await threadService.getThread(clerkUserId, id);

    return res.status(200).json({ thread });
  } catch (error) {
    console.error('Error fetching thread:', error);
    if (error instanceof Error && error.message === 'Thread not found') {
      return res.status(404).json({ error: 'Thread not found' });
    }
    return res.status(500).json({ error: 'Error fetching thread' });
  }
});

// Update thread
router.put('/:id', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = req.clerkUserId!;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing thread ID' });
    }

    const thread = await threadService.updateThread(clerkUserId, id, updates);

    return res.status(200).json({ thread });
  } catch (error) {
    console.error('Error updating thread:', error);
    return res.status(500).json({ error: 'Error updating thread' });
  }
});

// Delete thread
router.delete('/:id', clerkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = req.clerkUserId!;

    if (!id) {
      return res.status(400).json({ error: 'Missing thread ID' });
    }

    await threadService.deleteThread(clerkUserId, id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return res.status(500).json({ error: 'Error deleting thread' });
  }
});

// Get user stats (premium status, thread counts, etc.)
router.get('/stats/user', clerkAuth, async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const stats = await threadService.getUserStats(clerkUserId);

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Error fetching user stats' });
  }
});

export default router; 