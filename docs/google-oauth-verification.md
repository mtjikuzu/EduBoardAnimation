# Google OAuth Verification — YouTube Publishing

EduWhiteboard needs Google OAuth verification before the YouTube publishing feature can be used by creators outside of testing.

## Required steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g. "EduWhiteboard")
3. Enable the **YouTube Data API v3**

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - **App name:** EduWhiteboard
   - **User support email:** your email
   - **Developer contact:** your email
4. Add the `https://www.googleapis.com/auth/youtube.upload` scope
5. Add test users for development
6. **Publish** the app when ready for beta

### 3. Create OAuth Client ID

1. Navigate to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Choose **Web application**
4. Set:
   - **Authorized JavaScript origins:** `https://your-domain.com`
   - **Authorized redirect URIs:** `https://your-domain.com/api/publish/youtube/callback`

### 4. Verification requirements

Before the consent screen is verified (removing the "unverified app" warning):

| Requirement | Status | Notes |
|------------|--------|-------|
| Verified domain | Required | Must own or verify the domain in Google Search Console |
| Privacy Policy URL | ✅ Done | `https://your-domain.com/privacy` |
| Homepage URL | ✅ Done | `https://your-domain.com` |
| YouTube upload scope | Required | Justification: "Upload educational videos to the creator's channel" |
| App verification video | May be required | Short demo showing the upload flow |

### 5. Environment variables

```bash
YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret
```

Set these in your `.env` file or Docker environment.

### 6. Testing

1. Add test email addresses to the OAuth consent screen
2. Start the app and navigate to Export → Connect YouTube
3. Complete the OAuth flow
4. Upload a test video (will be private by default)

## References

- [YouTube Data API docs](https://developers.google.com/youtube/v3/docs)
- [OAuth verification requirements](https://support.google.com/cloud/answer/13464321)
- [YouTube API Services Terms](https://developers.google.com/youtube/terms/api-services-terms-of-service)
