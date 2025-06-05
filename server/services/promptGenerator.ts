/**
 * Service for generating structured prompts for AI based on crypto data
 */
export class PromptGeneratorService {
  /**
   * Generate a structured prompt for the AI model
   * @param cryptoData Data from all APIs (price, news, proposals)
   * @param options Advanced thread generation options
   * @returns Formatted prompt string
   */
  generatePrompt(
    cryptoData: any, 
    options: {
      includePricePredictions?: boolean;
      includeTechnicalAnalysis?: boolean;
      includeCryptoNews?: boolean;
      includeGovernanceProposals?: boolean;
      threadTone?: string;
      sentiment?: string;
      timeframe?: string;
    } = {}
  ): string {
    // Set default options if not provided
    const threadOptions = {
      includePricePredictions: options.includePricePredictions !== undefined ? options.includePricePredictions : true,
      includeTechnicalAnalysis: options.includeTechnicalAnalysis !== undefined ? options.includeTechnicalAnalysis : true,
      includeCryptoNews: options.includeCryptoNews !== undefined ? options.includeCryptoNews : true,
      includeGovernanceProposals: options.includeGovernanceProposals !== undefined ? options.includeGovernanceProposals : true,
      threadTone: options.threadTone || 'expert',
      sentiment: options.sentiment || 'neutral',
      timeframe: options.timeframe || 'short'
    };
    
    // Format the token data
    const tokenData = this.formatTokenData(cryptoData.token);
    
    // Format the news data - only if includeCryptoNews is true
    const newsData = threadOptions.includeCryptoNews 
      ? this.formatNewsData(cryptoData.news) 
      : "RECENT NEWS: Not requested for this thread";
    
    // Format the proposals data - only if includeGovernanceProposals is true
    const proposalsData = threadOptions.includeGovernanceProposals 
      ? this.formatProposalsData(cryptoData.proposals) 
      : "GOVERNANCE PROPOSALS: Not requested for this thread";
    
    // Create sentiment-specific analysis instructions
    let sentimentInstructions = '';
    switch (threadOptions.sentiment) {
      case 'bullish':
        sentimentInstructions = `
SENTIMENT ANALYSIS: BULLISH PERSPECTIVE
- Focus on positive catalysts and growth drivers
- Highlight strong fundamentals and adoption metrics
- Emphasize upside potential and price targets
- Mention positive news, partnerships, or developments
- Use optimistic language about future prospects
- Include reasons why this could be a good investment opportunity`;
        break;
      case 'bearish':
        sentimentInstructions = `
SENTIMENT ANALYSIS: BEARISH PERSPECTIVE  
- Focus on risks, challenges, and potential concerns
- Highlight competitive threats and market headwinds
- Emphasize downside risks and support levels to watch
- Mention negative news, regulatory concerns, or technical issues
- Use cautious language about future performance
- Include reasons for potential price weakness or correction`;
        break;
      case 'neutral':
      default:
        sentimentInstructions = `
SENTIMENT ANALYSIS: NEUTRAL PERSPECTIVE
- Present balanced view with both bullish and bearish factors
- Focus on objective data and technical analysis
- Highlight key levels to watch (both support and resistance)
- Mention both positive and negative developments equally
- Use analytical language focused on facts and data
- Include balanced assessment of risks vs opportunities`;
        break;
    }

    // Create timeframe-specific analysis instructions
    let timeframeInstructions = '';
    switch (threadOptions.timeframe) {
      case 'short':
        timeframeInstructions = `
TIMEFRAME ANALYSIS: SHORT-TERM FOCUS (1-30 days)
- Focus on immediate price action and recent developments
- Highlight daily and weekly chart patterns
- Mention short-term catalysts and events
- Include intraday trading levels and momentum
- Discuss upcoming events in the next few weeks
- Use language focused on immediate trading opportunities`;
        break;
      case 'medium':
        timeframeInstructions = `
TIMEFRAME ANALYSIS: MEDIUM-TERM FOCUS (1-6 months)
- Focus on quarterly trends and seasonal patterns
- Highlight monthly and weekly technical analysis
- Mention upcoming quarterly reports, releases, or milestones
- Include medium-term adoption trends and metrics
- Discuss potential price movements over the next few months
- Use language focused on swing trading and position building`;
        break;
      case 'long':
        timeframeInstructions = `
TIMEFRAME ANALYSIS: LONG-TERM FOCUS (6+ months)
- Focus on fundamental analysis and long-term vision
- Highlight yearly trends and major cycle patterns
- Mention long-term roadmap, technology development, and adoption
- Include macro trends affecting the entire sector
- Discuss potential for multi-year growth and value creation
- Use language focused on investment thesis and hodling strategy`;
        break;
      default:
        timeframeInstructions = '';
    }

    // Create tone-specific instructions based on threadTone
    let toneInstructions = '';
    switch (threadOptions.threadTone) {
      case 'bullish':
        toneInstructions = `
- Take a bullish perspective on ${cryptoData.token?.name || "this cryptocurrency"}
- Highlight positive developments and upside potential
- Focus on optimistic price projections
- Emphasize growth opportunities and adoption
- Use emojis like 🚀, 💰, 🔥, 💎, 🙌`;
        break;
      case 'bearish':
        toneInstructions = `
- Take a bearish perspective on ${cryptoData.token?.name || "this cryptocurrency"}
- Highlight potential risks and downside scenarios
- Discuss cautious price projections
- Emphasize challenges and competitive threats
- Use emojis like 📉, ⚠️, 🔍, 🧐, 💭`;
        break;
      case 'neutral':
        toneInstructions = `
- Take a balanced, analytical perspective on ${cryptoData.token?.name || "this cryptocurrency"}
- Present both bullish and bearish arguments
- Provide objective price analysis
- Emphasize data-driven insights rather than opinion
- Use emojis like 📊, 🔍, 📝, 📈📉, 🤔`;
        break;
      case 'influencer':
        toneInstructions = `
- Write with high energy and excitement about ${cryptoData.token?.name || "this cryptocurrency"}
- Use engaging, attention-grabbing language
- Include plenty of emojis throughout (🚀, 💪, 🔥, 💯, 🙌)
- Create FOMO (Fear Of Missing Out) with your language
- Use phrases like "huge potential", "don't miss out", "game changer"`;
        break;
      case 'expert':
      default:
        toneInstructions = `
- Write as a knowledgeable crypto expert
- Balance technical insights with accessible language
- Be authoritative but approachable
- Use emojis strategically (not too many)
- Demonstrate deep understanding of market dynamics`;
        break;
    }
    
    // Add specific sections based on options
    let additionalInstructions = '';
    
    if (threadOptions.includePricePredictions) {
      const timeframePredictions = threadOptions.timeframe === 'short' ? 'next 1-4 weeks' : 
                                  threadOptions.timeframe === 'medium' ? 'next 1-6 months' : 
                                  'next 6-24 months';
      additionalInstructions += `
- Include price predictions and potential price targets for the ${timeframePredictions}
- Discuss potential future price movements based on the data and ${threadOptions.sentiment} sentiment
- Mention key price support and resistance levels relevant to the ${threadOptions.timeframe}-term outlook`;
    }
    
    if (threadOptions.includeTechnicalAnalysis) {
      additionalInstructions += `
- Include technical analysis insights appropriate for ${threadOptions.timeframe}-term analysis
- Mention trends, patterns, or significant chart formations on relevant timeframes
- Reference key technical indicators where relevant to the ${threadOptions.sentiment} outlook
- Discuss trading volume and market activity supporting the ${threadOptions.sentiment} thesis`;
    }
    
    // Create the system prompt with structured data and enhanced instructions
    const prompt = `
I need you to generate a viral Twitter thread (10 tweets) about ${cryptoData.token?.name || "this cryptocurrency"} with a ${threadOptions.sentiment} sentiment and ${threadOptions.timeframe}-term analysis focus.

Here's the real-time data to use:

${tokenData}

${newsData}

${proposalsData}

${sentimentInstructions}

${timeframeInstructions}

IMPORTANT GUIDELINES:
1. Create a thread with exactly 10 tweets, numbered 1-10
2. First tweet should be a strong hook about price or major news
3. Include price insights, news summary, and governance proposals
4. Add some alpha (insider tips) and advice based on the data
5. End with a call-to-action to retweet/follow
6. Use emojis, bullet points, and numbers strategically
7. Keep each tweet under 280 characters
8. Make it sound like an expert crypto ${threadOptions.threadTone}
9. Format each tweet with its number (1/10, 2/10, etc.)
10. Don't include any explanatory text - just the thread content
11. Align all analysis with the ${threadOptions.sentiment} sentiment and ${threadOptions.timeframe}-term timeframe
${toneInstructions}
${additionalInstructions}

Output the thread with each tweet separated by two newlines.
`;

    return prompt;
  }

  /**
   * Format token price data for the prompt
   * @param tokenData Price and market data
   * @returns Formatted string
   */
  private formatTokenData(tokenData: any): string {
    if (!tokenData) {
      return "TOKEN DATA: Not available";
    }

    const priceChangeEmoji = tokenData.priceChangePercentage24h >= 0 ? "🟢" : "🔴";
    const priceChangeSign = tokenData.priceChangePercentage24h >= 0 ? "+" : "";

    return `TOKEN DATA:
- Name: ${tokenData.name} (${tokenData.symbol})
- Current Price: $${this.formatNumber(tokenData.price)}
- 24h Change: ${priceChangeEmoji} ${priceChangeSign}${tokenData.priceChangePercentage24h?.toFixed(2)}%
- Market Cap: $${this.formatLargeNumber(tokenData.marketCap)}
- 24h Trading Volume: $${this.formatLargeNumber(tokenData.volume24h)}
- 24h High: $${this.formatNumber(tokenData.high24h)}
- 24h Low: $${this.formatNumber(tokenData.low24h)}
- All-Time High: $${this.formatNumber(tokenData.allTimeHigh)}`;
  }

  /**
   * Format news data for the prompt
   * @param newsData Array of news articles
   * @returns Formatted string
   */
  private formatNewsData(newsData: any[]): string {
    if (!newsData || newsData.length === 0) {
      return "RECENT NEWS: No recent news available";
    }

    let newsText = "RECENT NEWS:";
    
    newsData.forEach((news, index) => {
      newsText += `\n- ${news.title} (Source: ${news.source})`;
    });

    return newsText;
  }

  /**
   * Format proposals data for the prompt
   * @param proposalsData Array of governance proposals
   * @returns Formatted string
   */
  private formatProposalsData(proposalsData: any[]): string {
    if (!proposalsData || proposalsData.length === 0) {
      return "GOVERNANCE PROPOSALS: No recent governance proposals available";
    }

    let proposalsText = "GOVERNANCE PROPOSALS:";
    
    proposalsData.forEach((proposal, index) => {
      const state = this.formatProposalState(proposal.state);
      proposalsText += `\n- ${proposal.title} (Status: ${state}, Votes: ${this.formatLargeNumber(proposal.totalVotes)})`;
    });

    return proposalsText;
  }

  /**
   * Format proposal state to be more readable
   * @param state Proposal state from API
   * @returns Formatted state string
   */
  private formatProposalState(state: string): string {
    switch (state) {
      case 'active':
        return 'Active';
      case 'closed':
        return 'Closed';
      case 'pending':
        return 'Pending';
      default:
        return state.charAt(0).toUpperCase() + state.slice(1);
    }
  }

  /**
   * Format large numbers with K, M, B suffixes
   * @param num Number to format
   * @returns Formatted string
   */
  private formatLargeNumber(num: number): string {
    if (!num) return "0";
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    
    return num.toString();
  }

  /**
   * Format number with appropriate decimal places
   * @param num Number to format
   * @returns Formatted string
   */
  private formatNumber(num: number): string {
    if (!num) return "0";
    
    // For very small numbers (less than 0.01)
    if (num < 0.01) {
      return num.toFixed(8);
    }
    
    // For small numbers (less than 1)
    if (num < 1) {
      return num.toFixed(4);
    }
    
    // For medium numbers (less than 1000)
    if (num < 1000) {
      return num.toFixed(2);
    }
    
    // For large numbers (1000+)
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
} 