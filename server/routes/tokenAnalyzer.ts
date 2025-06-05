import { Router } from 'express';
import { TokenAnalyzerService } from '../services/tokenAnalyzer';

const router = Router();
const tokenAnalyzerService = new TokenAnalyzerService();

/**
 * @route POST /api/tokenAnalyzer/analyze
 * @desc Analyze a token from Twitter handle or token name
 * @access Public
 */
router.post('/analyze', async (req, res) => {
  try {
    const { 
      tokenIdentifier,
      includeHistoricalData = false,
      historicalDays = 7,
      includeSentiment = false
    } = req.body;
    
    if (!tokenIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Token identifier (name or handle) is required'
      });
    }
    
    console.log(`Received request to analyze token: ${tokenIdentifier}`);
    
    const options = {
      includeHistoricalData,
      historicalDays,
      includeSentiment
    };
    
    const tokenData = await tokenAnalyzerService.analyzeToken(tokenIdentifier, options);
    
    return res.json(tokenData);
  } catch (error) {
    console.error('Error in token analyzer route:', error);
    return res.status(500).json({
      success: false,
      message: `Error analyzing token: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * @route GET /api/tokenAnalyzer/analyze/:tokenIdentifier
 * @desc Analyze a token from Twitter handle or token name (GET version)
 * @access Public
 */
router.get('/analyze/:tokenIdentifier', async (req, res) => {
  try {
    const { tokenIdentifier } = req.params;
    const includeHistoricalData = req.query.history === 'true';
    const historicalDays = parseInt(req.query.days as string) || 7;
    const includeSentiment = req.query.sentiment === 'true';
    
    if (!tokenIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Token identifier (name or handle) is required'
      });
    }
    
    console.log(`Received GET request to analyze token: ${tokenIdentifier}`);
    
    const options = {
      includeHistoricalData,
      historicalDays,
      includeSentiment
    };
    
    const tokenData = await tokenAnalyzerService.analyzeToken(tokenIdentifier, options);
    
    return res.json(tokenData);
  } catch (error) {
    console.error('Error in token analyzer route:', error);
    return res.status(500).json({
      success: false,
      message: `Error analyzing token: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * @route GET /api/tokenAnalyzer/compare
 * @desc Compare multiple tokens based on Twitter handles
 * @access Public
 */
router.get('/compare', async (req, res) => {
  try {
    const tokenList = req.query.tokens as string;
    
    if (!tokenList) {
      return res.status(400).json({
        success: false,
        message: 'Token list is required (comma-separated)'
      });
    }
    
    // Parse comma-separated token list
    const tokens = tokenList.split(',').map(t => t.trim());
    
    if (tokens.length < 2 || tokens.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2-5 tokens to compare'
      });
    }
    
    console.log(`Comparing tokens: ${tokens.join(', ')}`);
    
    // Analyze each token
    const results = await Promise.all(
      tokens.map(token => tokenAnalyzerService.analyzeToken(token, {
        includeHistoricalData: true,
        includeSentiment: true
      }))
    );
    
    return res.json({
      success: true,
      comparison: results
    });
  } catch (error) {
    console.error('Error in token comparison route:', error);
    return res.status(500).json({
      success: false,
      message: `Error comparing tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * @route GET /api/tokenAnalyzer/trending
 * @desc Get trending tokens based on volume and social activity
 * @access Public
 */
router.get('/trending', async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Trending tokens feature is coming soon"
    });
  } catch (error) {
    console.error('Error in trending tokens route:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

export default router; 