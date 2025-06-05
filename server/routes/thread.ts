import express from 'express';
import { canGenerateThread, incrementThreadCount, ensureUserHasSubscriptionPlan, storeThread, getUserThreads, getThreadById, getUserSubscriptionPlan, updateUserSubscription } from '../db/storage';
import { config } from '../config';
import { updateUserPlan, getUserProfile } from '../lib/supabase';

const router = express.Router();

// Generate Twitter thread
router.post('/generate', async (req, res) => {
  try {
    const { topic, tone, userId, options } = req.body;

    if (!topic || !tone || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      // First attempt with primary model
      let modelToUse = config.aiModel;
      let retryCount = 0;
      let maxRetries = 1;
      let data;
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

          // FIXED: Read response text once and handle all cases
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
                error: 'Error generating thread', 
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
          
          // Log the response structure for debugging
          if (config.isDevelopment) {
            console.log('API Response structure:', JSON.stringify(data, null, 2));
          }
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response format:', data);
            // If this is the first attempt, try with fallback model
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
          // If this is the first attempt, try with fallback model
          if (retryCount === 0) {
            console.error('Error with primary model, trying fallback:', error);
            modelToUse = config.fallbackAiModel;
            retryCount++;
            continue;
          } else {
            // If we've already tried the fallback model, re-throw the error
            throw error;
          }
        }
      }

      // Prepare thread data
      console.log('Preparing thread data with topic:', topic);
      
      // Check if user is on free plan to add watermark
      const isFreeUser = remaining <= config.dailyThreadLimitFree;
      
      // Add watermark for free users
      if (isFreeUser) {
        threadContent += `\n\n${threadContent.includes('10/10') ? '11/11' : threadContent.includes('5/5') ? '6/6' : '🔍'}: Generated with ThreadFlow Free. Upgrade for watermark-free threads at threadflowpro.app`;
      }
      
      const threadData = {
        userId: userId,
        title: topic,
        topic: topic,
        tone: tone,
        content: threadContent,
        length: threadContent.length,
        created_at: new Date().toISOString()
      };
      console.log('Thread data to insert:', threadData);

      // Store in storage
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
        thread, 
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
    console.error('Error generating thread:', error);
    return res.status(500).json({ error: 'Error generating thread' });
  }
});

// Get user threads
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const { data, error } = await getUserThreads(userId);

    if (error) {
      console.error('Error fetching threads:', error);
      return res.status(500).json({ error: 'Error fetching threads' });
    }

    return res.status(200).json({ threads: data });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return res.status(500).json({ error: 'Error fetching threads' });
  }
});

// Get specific thread
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing thread ID' });
    }

    const { data, error } = await getThreadById(id);

    if (error) {
      console.error('Error fetching thread:', error);
      return res.status(500).json({ error: 'Error fetching thread' });
    }

    return res.status(200).json({ thread: data });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return res.status(500).json({ error: 'Error fetching thread' });
  }
});

// Get user remaining threads for today
router.get('/limit/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const { canGenerate, remaining } = await canGenerateThread(userId);

    return res.status(200).json({ canGenerate, remaining });
  } catch (error) {
    console.error('Error checking thread limit:', error);
    return res.status(500).json({ error: 'Error checking thread limit' });
  }
});

// Get user plan details and thread limits
router.get('/plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Get user's subscription plan
    const plan = await getUserSubscriptionPlan(userId);
    
    // Check current thread usage/remaining
    const { remaining } = await canGenerateThread(userId);
    
    // Calculate used threads
    const used = plan.dailyLimit - remaining;

    return res.status(200).json({ 
      plan: plan.planType,
      dailyLimit: plan.dailyLimit,
      used,
      remaining
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return res.status(500).json({ error: 'Error fetching user plan' });
  }
});

// Update user subscription plan
router.post('/update-plan', async (req, res) => {
  try {
    const { userId, planType, paymentId } = req.body;

    if (!userId || !planType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate plan type
    if (!['free', 'pro', 'premium'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Update the user's subscription plan
    const success = await updateUserSubscription(userId, planType, paymentId || 'direct-update');
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update subscription plan' });
    }
    
    // Get the updated plan details
    const plan = await getUserSubscriptionPlan(userId);
    const { remaining } = await canGenerateThread(userId);
    
    // Calculate used threads (should be 0 after plan update)
    const used = plan.dailyLimit - remaining;

    return res.status(200).json({ 
      success: true,
      message: `Subscription plan updated to ${planType}`,
      plan: planType,
      dailyLimit: plan.dailyLimit,
      used,
      remaining
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return res.status(500).json({ error: 'Error updating subscription plan' });
  }
});

// Update user premium status in Supabase
router.post('/update-supabase-premium', async (req, res) => {
  try {
    const { userId, isPremium, planType } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Validate premium flag
    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({ error: 'Invalid premium status, must be boolean' });
    }

    // Validate plan type
    const validPlanTypes = ['free', 'premium', 'lifetime'];
    const effectivePlanType = planType || (isPremium ? 'premium' : 'free');
    
    if (!validPlanTypes.includes(effectivePlanType)) {
      return res.status(400).json({ error: `Invalid plan type, must be one of: ${validPlanTypes.join(', ')}` });
    }

    // Get existing user profile from Supabase
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found in Supabase database' });
    }
    
    // Update user's premium status in Supabase
    const updatedUser = await updateUserPlan(userId, isPremium ? 'premium' : 'free');
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user premium status in Supabase' });
    }
    
    // Also update the in-memory storage for immediate effect
    await updateUserSubscription(userId, effectivePlanType, 'direct-update');
    
    // Get the updated profile
    const updatedProfile = await getUserProfile(userId);
    
    return res.status(200).json({ 
      success: true,
      message: `User premium status updated successfully to ${isPremium ? 'premium' : 'free'}`,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user premium status:', error);
    return res.status(500).json({ error: 'Error updating user premium status' });
  }
});

// Manually refresh a user's premium status
router.post('/refresh-premium/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType = 'pro' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // Validate plan type
    if (!['free', 'basic', 'pro', 'premium'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    console.log(`Manually refreshing premium status for user ${userId} to ${planType}`);

    // Update the user's subscription plan
    const success = await updateUserSubscription(userId, planType, 'manual-refresh-' + Date.now());
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update subscription plan' });
    }
    
    // Get the updated plan details
    const plan = await getUserSubscriptionPlan(userId);
    const { remaining } = await canGenerateThread(userId);
    
    // Calculate used threads (should be 0 after plan update)
    const used = plan.dailyLimit - remaining;

    return res.status(200).json({ 
      success: true,
      message: `Subscription plan updated to ${planType}`,
      plan: planType,
      dailyLimit: plan.dailyLimit,
      used,
      remaining
    });
  } catch (error) {
    console.error('Error refreshing premium status:', error);
    return res.status(500).json({ error: 'Error refreshing premium status' });
  }
});

export default router; 