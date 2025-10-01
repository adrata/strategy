// Test script to verify engagement strategy formatting
const testEngagementStrategy = "Position Solutions As Tools That Enhance Safety Program Effectiveness, Reduce Incident Rates, And Demonstrate Regulatory Compliance. Lead With Data-Driven Case Studies From Similar-Sized Electric Cooperatives, Emphasizing ROI Through Reduced Workers' Compensation Claims And Improved Safety Culture. Offer Hands-On Demonstrations Or Pilot Programs That Allow Him To Evaluate Effectiveness Before Full Commitment.";

console.log('🧪 Testing Engagement Strategy Formatting...');
console.log('Original length:', testEngagementStrategy.length);
console.log('Original text:', testEngagementStrategy);

// Test the new formatting logic
const formatted = testEngagementStrategy.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);

console.log('\n📝 Formatted sentences:');
formatted.forEach((sentence, index) => {
  console.log(`${index + 1}. ${sentence.trim()}`);
});

console.log('\n✅ Formatting test complete!');
