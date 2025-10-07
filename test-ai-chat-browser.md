# AI Chat "Who is [Name]" Test Guide

## 🧪 Testing the AI Chat Person Search Functionality

### Test Setup
1. **Start the development server**: `npm run dev`
2. **Open the application**: Navigate to `http://localhost:3000`
3. **Login with Dan's credentials** (if required)
4. **Open the AI chat panel** (right side panel)

### Test Cases to Try

#### ✅ **Expected to Find People (Based on Database)**
Try these queries in the AI chat:

1. **"Who is John Dano"**
   - Should find: John Dano, VP of Sales at Retail Product Solutions
   - Expected response: Person details with company info, role, contact info

2. **"Who is John Doe"** 
   - Should find: Multiple John Doe entries (may need disambiguation)
   - Expected response: List of John Doe people with different companies

3. **"Find me John Dano"**
   - Alternative query format
   - Should return same results as "Who is John Dano"

4. **"Show me Bob Johnson"**
   - Should find: Bob Johnson at Prospect Test Inc
   - Expected response: Person details with company info

#### ❌ **Expected to Not Find (Test Negative Cases)**
Try these queries that should NOT find matches:

1. **"Who is Daniel Jackson"**
   - Should return: "I searched your database for Daniel Jackson but didn't find an exact match"
   - Should suggest similar names or ask for more details

2. **"Who is Sarah Johnson"**
   - Should return: No exact match found
   - Should suggest alternatives or ask for clarification

### Expected AI Response Format

When a person IS found, the AI should respond with:

```
I found John Dano in your database:

**John Dano** - VP of Sales
• Company: Retail Product Solutions
• Industry: Retail Fixtures and Display Equipment
• Email: [if available]
• Phone: [if available]
• Recent Activities: [if any]

[Additional context about the person's role and company]
```

When a person is NOT found, the AI should respond with:

```
I searched your database for [Name] but didn't find an exact match. However, I did find several people with similar names in your CRM. Is it possible you meant one of them, or perhaps the name is slightly different?

A few things that might help me find the right person:
- Do you remember their company or what industry they're in?
- Do you know their job title or role?
- Any other details like when you last spoke with them or what they do?

Let me know and I'll do another search with those details to track down the right person for you.
```

### Link Styling Verification

When the AI responds with person names, verify that:
- **Person names** appear as **green pill-style links**
- **Company names** appear as **blue pill-style links** 
- **Email addresses** appear as **purple pill-style links**
- **Phone numbers** appear as **orange pill-style links**

### Test Steps

1. **Open AI Chat Panel**
   - Click the AI chat icon in the right panel
   - Ensure the chat interface is visible

2. **Test Positive Cases**
   - Type: "Who is John Delisi"
   - Press Enter
   - Verify: Person details are displayed with proper pill-style links
   - Repeat for "Who is Dustin Stephens"

3. **Test Negative Cases**
   - Type: "Who is Daniel Jackson"
   - Press Enter
   - Verify: "No exact match" response with helpful suggestions

4. **Test Alternative Query Formats**
   - Try: "Find me John Delisi"
   - Try: "Show me Dustin Stephens"
   - Try: "Tell me about John Delisi"

5. **Verify Link Functionality**
   - Click on person name links (should navigate to person profile)
   - Click on company name links (should navigate to company profile)
   - Click on email links (should open email client or copy to clipboard)

### Success Criteria

✅ **Test Passes If:**
- Person search queries return detailed person information
- Person names, companies, emails, phones appear as styled pill links
- Links are clickable and functional
- Negative cases return helpful "not found" messages
- AI responses are conversational and helpful

❌ **Test Fails If:**
- Person search returns generic responses
- Links appear as plain text (not pill-styled)
- Links are not clickable
- Database errors occur
- Authentication issues prevent testing

### Troubleshooting

If tests fail:
1. **Check database connection** - Ensure Prisma can connect to database
2. **Verify authentication** - Ensure user is properly logged in
3. **Check console errors** - Look for JavaScript errors in browser console
4. **Verify API endpoints** - Check if `/api/ai-chat` is responding
5. **Check person data** - Verify test people exist in database

### Database Verification

To verify test people exist, you can run:
```bash
# Check if test people exist in database
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.people.findMany({
  where: { 
    workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
    OR: [
      { fullName: { contains: 'John Delisi' } },
      { fullName: { contains: 'Dustin Stephens' } }
    ]
  }
}).then(people => {
  console.log('Found people:', people.map(p => p.fullName));
  prisma.$disconnect();
});
"
```
