# Configuration Setup

This directory contains the database configuration files for the StoryBox application.

## Important Security Notice

⚠️ **NEVER commit real API keys or secrets to version control!**

The `settings.json` file contains sensitive information and should be kept secure.

## Setup Instructions

1. **Copy the template file:**
   ```bash
   cp settings.template.json settings.json
   ```

2. **Replace placeholder values** in `settings.json` with your actual API keys:
   - Stripe API keys (publishable and secret)
   - RazorPay credentials
   - FlutterWave ID
   - Firebase service account details
   - AWS/DigitalOcean credentials (if using cloud storage)
   - Google AdMob IDs
   - Resend API key

3. **Keep your `settings.json` file secure** - it's already added to `.gitignore` to prevent accidental commits.

## API Keys Required

### Payment Gateways
- **Stripe**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **RazorPay**: Get from [RazorPay Dashboard](https://dashboard.razorpay.com/settings/api-keys)
- **FlutterWave**: Get from [FlutterWave Dashboard](https://dashboard.flutterwave.com/settings/apis)

### Firebase
- **Service Account**: Download from [Firebase Console](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk)

### Google AdMob
- **Ad Unit IDs**: Create from [AdMob Console](https://admob.google.com/home/)

### Cloud Storage (Optional)
- **AWS S3**: Access keys from [AWS IAM](https://console.aws.amazon.com/iam/)
- **DigitalOcean Spaces**: Access keys from [DigitalOcean API](https://cloud.digitalocean.com/account/api/tokens)

## Environment Variables

For production, consider using environment variables instead of hardcoding values in the JSON file.

## Support

If you need help setting up any of these services, refer to their respective documentation:
- [Stripe Documentation](https://stripe.com/docs)
- [RazorPay Documentation](https://razorpay.com/docs/)
- [FlutterWave Documentation](https://developer.flutterwave.com/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
