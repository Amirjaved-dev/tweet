import express from 'express';
import { canGenerateThread, incrementThreadCount, ensureUserHasSubscriptionPlan, storeThread } from '../db/storage';
import { config } from '../config';

const router = express.Router();

/**
 * Generate a real-time Twitter thread based on current trends and data
 * POST /api/realtime/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { topic, dataSource, timeRange, userId, options } = req.body;

    // Validate input
    if (!dataSource || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For custom data source, topic is required
    if (dataSource === 'custom' && !topic) {
      return res.status(400).json({ error: 'Topic is required for custom data source' });
    }

    // Ensure user has a subscription plan
    await ensureUserHasSubscriptionPlan(userId);

    // Check if user can generate thread
    const { canGenerate, remaining } = await canGenerateThread(userId);

    if (!canGenerate) {
      return res.status(403).json({ 
        error: 'Daily thread generation limit reached', 
        remaining: 0 
      });
    }

    // Process advanced options from frontend
    const advancedOptions = {
      includeImages: options?.includeImages !== undefined ? options.includeImages : true,
      includeLinks: options?.includeLinks !== undefined ? options.includeLinks : true,
      includeStats: options?.includeStats !== undefined ? options.includeStats : true,
      includeTrends: options?.includeTrends !== undefined ? options.includeTrends : true,
    };

    // Build prompt based on data source and time range
    let prompt = '';
    let threadTopic = topic || dataSource;

    switch (dataSource) {
      case 'trending':
        prompt = `Generate a Twitter thread about current trending topics across social media and search engines. `;
        prompt += `Focus on ${timeRange === 'hour' ? 'the latest trends from the past hour' : 
                  timeRange === 'week' ? 'major trends from this week' : 'today\'s trending topics'}. `;
        prompt += `Include what's popular, why it's trending, and provide insights or commentary. `;
        threadTopic = 'Current Trending Topics';
        break;

      case 'news':
        prompt = `Generate a Twitter thread about the most important news stories. `;
        prompt += `Focus on ${timeRange === 'hour' ? 'breaking news from the last hour' : 
                  timeRange === 'week' ? 'major news stories from this week' : 'today\'s top news'}. `;
        prompt += `Provide context, analysis, and explain why these stories matter. `;
        threadTopic = 'Latest News Analysis';
        break;

      case 'market':
        prompt = `Generate a Twitter thread about current market conditions and financial trends. `;
        prompt += `Focus on ${timeRange === 'hour' ? 'market movements from the last hour' : 
                  timeRange === 'week' ? 'weekly market performance and trends' : 'today\'s market activity'}. `;
        prompt += `Include stock market updates, crypto movements, and economic indicators. `;
        threadTopic = 'Market Analysis';
        break;

      case 'custom':
        prompt = `Generate a Twitter thread about "${topic}" using the most current and relevant information available. `;
        prompt += `Focus on ${timeRange === 'hour' ? 'the very latest developments' : 
                  timeRange === 'week' ? 'recent developments and trends from this week' : 'current status and today\'s updates'}. `;
        prompt += `Provide real-time insights, current data, and fresh perspectives. `;
        threadTopic = topic;
        break;

      default:
        return res.status(400).json({ error: 'Invalid data source' });
    }

    // Add formatting and engagement instructions
    prompt += `\n\nThread requirements:`;
    prompt += `\n- Create 8-12 engaging tweets that provide value`;
    prompt += `\n- Start with a compelling hook that grabs attention`;
    prompt += `\n- Use current, up-to-date information and data`;
    prompt += `\n- Each tweet should be within 280 characters`;
    prompt += `\n- Number each tweet (1/X format)`;
    prompt += `\n- Include relevant emojis for engagement`;

    if (advancedOptions.includeStats) {
      prompt += `\n- Include current statistics, numbers, and data points where relevant`;
    }

    if (advancedOptions.includeTrends) {
      prompt += `\n- Include trending hashtags that are currently popular`;
    }

    if (advancedOptions.includeLinks) {
      prompt += `\n- Suggest places where source links would be valuable (mention "source link here")`;
    }

    if (advancedOptions.includeImages) {
      prompt += `\n- Suggest where images, charts, or visuals would enhance the thread`;
    }

    prompt += `\n- End with a call-to-action encouraging engagement`;
    prompt += `\n\nFocus on providing real-time, actionable insights that readers can't get from outdated content. Make it feel current and urgent.`;
    prompt += `\n\nDon't include any introductory text - just output the actual tweets, each separated by a double newline.`;

    // Check if OpenRouter API key is configured
    if (!config.openRouterApiKey) {
      console.error('Missing OpenRouter API key');
      return res.status(500).json({ error: 'API configuration error' });
    }

    try {
      // Generate thread using AI with real-time focus
      let modelToUse = config.aiModel;
      let retryCount = 0;
      let maxRetries = 1;
      let data;
      let threadContent;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Generating real-time thread using model: ${modelToUse}`);
          
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
                  content: `You are an expert real-time content creator and social media analyst. You specialize in creating Twitter threads about current events, trends, and breaking news. You have access to the most current information and can provide timely, relevant insights. You understand how to make content feel urgent and current.` 
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.8, // Slightly higher for more creative real-time content
              max_tokens: 1500
            }),
          });

          // Handle response similar to other routes
          const responseText = await response.text();
          console.log('Response status:', response.status);
          
          // Handle empty responses
          if (!responseText || responseText.trim() === '') {
            console.error('Empty response from API');
            
            // If this is the first attempt, switch to fallback model
            if (retryCount === 0) {
              console.log('Empty response. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Empty response from API');
            }
          }
          
          // Check for non-OK responses
          if (!response.ok) {
            console.error('OpenRouter API error:', responseText.substring(0, 200));
            
            // Try to parse error as JSON
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch (parseError) {
              errorData = { error: responseText };
            }
            
            // If this is the first attempt, switch to fallback model
            if (retryCount === 0) {
              console.log('API error. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              return res.status(response.status).json({ 
                error: 'Error generating real-time thread', 
                details: errorData 
              });
            }
          }
          
          // Parse successful response
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse API response as JSON:', responseText.substring(0, 200));
            
            // If this is the first attempt, try with fallback model
            if (retryCount === 0) {
              console.log('JSON parse error. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              throw new Error('Invalid JSON response from API');
            }
          }
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response format:', data);
            if (retryCount === 0) {
              console.log('Invalid response format. Retrying with fallback model...');
              modelToUse = config.fallbackAiModel;
              retryCount++;
              continue;
            } else {
              return res.status(500).json({ 
                error: 'Invalid API response format',
                details: data
              });
            }
          }
          
          threadContent = data.choices[0].message.content;
          break; // Successfully got a response, exit the loop
          
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

      // Check if user is on free plan to add watermark
      const isFreeUser = remaining <= config.dailyThreadLimitFree;
      
      // Add watermark for free users
      if (isFreeUser) {
        threadContent += `\n\n${threadContent.includes('10/10') ? '11/11' : threadContent.includes('8/8') ? '9/9' : '🔍'}: Generated with ThreadFlow Free. Upgrade for watermark-free threads at threadflowpro.app`;
      }
      
      // Prepare thread data for storage
      const threadData = {
        userId: userId,
        title: threadTopic,
        topic: threadTopic,
        tone: 'Real-time Analysis',
        content: threadContent,
        length: threadContent.length,
        created_at: new Date().toISOString(),
        metadata: JSON.stringify({
          dataSource,
          timeRange,
          options: advancedOptions,
          generatedAt: new Date().toISOString()
        })
      };

      // Store in database
      const { data: thread, error } = await storeThread(threadData);

      if (error) {
        console.error('Error storing thread:', error);
        return res.status(500).json({ error: 'Error storing thread' });
      }

      // Increment thread count
      await incrementThreadCount(userId);

      // Get updated thread count after increment
      const { remaining: updatedRemaining } = await canGenerateThread(userId);

      // Return the thread and remaining count
      return res.status(200).json({ 
        thread: {
          id: thread.id,
          topic: threadTopic,
          content: threadContent,
          created_at: thread.created_at,
          metadata: {
            dataSource,
            timeRange,
            generatedAt: new Date().toISOString()
          }
        }, 
        remaining: updatedRemaining 
      });

    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      
      // Get the current remaining count (unchanged since generation failed)
      const { remaining: currentRemaining } = await canGenerateThread(userId);
      
      return res.status(500).json({ 
        error: 'Error calling AI service',
        message: error instanceof Error ? error.message : 'Unknown error',
        remaining: currentRemaining
      });
    }
  } catch (error) {
    console.error('Error generating real-time thread:', error);
    return res.status(500).json({ error: 'Error generating real-time thread' });
  }
});

/**
 * Get available data sources and their current status
 * GET /api/realtime/sources
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = [
      {
        id: 'trending',
        name: 'Trending Topics',
        description: 'Current trending topics across social media and search',
        status: 'active',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'news',
        name: 'Latest News',
        description: 'Breaking news and major stories',
        status: 'active',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'market',
        name: 'Market Data',
        description: 'Stock market, crypto, and financial trends',
        status: 'active',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'custom',
        name: 'Custom Topic',
        description: 'Generate threads about any custom topic with real-time data',
        status: 'active',
        lastUpdated: new Date().toISOString()
      }
    ];

    return res.status(200).json({ sources });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return res.status(500).json({ error: 'Error fetching data sources' });
  }
});

export default router; 