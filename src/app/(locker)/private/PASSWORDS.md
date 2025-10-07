# Hard-Coded Password Protection System

This folder contains password-protected content with hard-coded passwords that bypass middleware issues.

## Password List

### TOP Engineering Plus
- **Password**: `TOP-Engineering-2025`
- **Path**: `/private/TOP/`
- **Description**: TOP Engineering Plus private intelligence reports

### Absorb LMS - athenahealth Report
- **Password**: `Absorb-Athena-2025`
- **Path**: `/private/absorb/athenahealth-bgi-case/`
- **Description**: athenahealth Buyer Group Intelligence Report for Absorb LMS

### SBI Growth - Flexera Report
- **Password**: `SBI-Flexera-2025`
- **Path**: `/private/sbi-growth/flexera-bgi-case/`
- **Description**: Flexera Buyer Group Intelligence Report for SBI Growth

## How It Works

1. **No Middleware Dependency**: All password protection is handled client-side using React components
2. **Session Storage**: Passwords are stored in browser session storage for the current session only
3. **Hard-Coded Validation**: Passwords are validated against hard-coded strings - no external API calls
4. **Logout Functionality**: Users can logout to clear session storage
5. **Hydration Safe**: Components prevent hydration mismatches with proper loading states

## Security Notes

- Passwords are stored in session storage (cleared when browser closes)
- No server-side validation (client-side only)
- No external dependencies or API calls
- Simple string comparison for password validation
- Logout button available in top-right corner when authenticated

## Usage

Each protected page wraps its content with a `PasswordProtection` component:

```tsx
<PasswordProtection correctPassword="YOUR-PASSWORD-HERE">
  {/* Protected content */}
</PasswordProtection>
```

## Testing

To test the password system:
1. Navigate to any protected route
2. Enter the correct password from the list above
3. Content should be accessible
4. Use the logout button to clear session
5. Refresh page to test session persistence
