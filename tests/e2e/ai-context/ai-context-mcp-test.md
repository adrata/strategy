# AI Context Fix Verification Test (MCP Browser)

This test verifies that the AI panel correctly receives and uses record context when viewing person records, specifically testing the fix for Camille Murdock where AI was saying "I don't have enough context".

## Test Steps

1. Navigate to localhost:3000/sign-in
2. Log in with test credentials
3. Navigate to Camille Murdock's speedrun detail page
4. Open AI right panel
5. Send message: "What's the best message to send via cold outreach?"
6. Verify AI response:
   - Does NOT contain "I don't have enough context"
   - Does NOT contain "not enough context"
   - References Camille Murdock or provides specific advice
   - Provides actionable cold outreach message recommendations

## Expected Results

- AI should have full context about Camille Murdock
- AI should provide personalized cold outreach message recommendations
- AI should reference the person's name, company, title, or other record details
- AI should NOT ask for more context

## Test Credentials

- Email/Username: vleland
- Password: TOPgtm01!
- Base URL: http://localhost:3000
- Test Record: /top/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742/?tab=overview

