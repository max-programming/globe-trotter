# ImgBB Image Upload Setup

This project uses ImgBB for image uploads on the sign-up and profile settings pages. ImgBB is a free image hosting service that provides a simple API for uploading images.

## Environment Configuration

Add your ImgBB API key to your environment variables:

```bash
# .env (or your preferred environment file)
IMGBB_API_KEY=your_imgbb_api_key_here
```

## Getting an ImgBB API Key

1. Go to [ImgBB](https://imgbb.com)
2. Create a free account or sign in
3. Navigate to the API section: https://api.imgbb.com/
4. Your API key will be displayed on the page

## Usage

The image upload functionality is automatically integrated into:

- **Sign-up form**: Users can upload a profile picture during registration
- **Profile settings**: Users can update their profile picture

## Implementation Details

### Server Functions

- `uploadImageToImgBB` in `src/server-functions/image-upload.ts` - For authenticated users (profile updates)
- `uploadImageForSignUp` in `src/server-functions/image-upload.ts` - For sign-up (no authentication required)
- Both handle image validation and upload to ImgBB
- Return direct image URLs that are stored in the database

### Custom Hooks

- `useImageUpload` in `src/lib/hooks/use-image-upload.ts` - For authenticated users (profile updates)
- `useSignUpImageUpload` in `src/lib/hooks/use-signup-image-upload.ts` - For sign-up (no authentication required)
- Both provide upload state management and file validation (5MB max, JPEG/PNG/WebP only)
- Return image URLs for immediate use

### UI Components

- `UserAvatar` in `src/components/ui/user-avatar.tsx` - Displays user profile images
- Upload functionality integrated into sign-up and profile forms

## Features

- **File Validation**: Size limits (5MB), type restrictions (JPEG, PNG, WebP)
- **Real-time Feedback**: Loading states and error handling
- **Direct URL Storage**: Image URLs stored directly in database
- **Responsive UI**: Works across different screen sizes
- **Authentication Handling**: Separate functions for sign-up (no auth) and profile updates (auth required)
- **Security**: Server-side validation and appropriate authentication checks

## ImgBB Limitations

- Free tier: Up to 100 images per hour
- Image URLs are permanent and publicly accessible
- No built-in image deletion via API (would need to use delete URLs if required)

## Example Usage

```tsx
// For authenticated profile updates
const imageUpload = useImageUpload({
  onSuccess: (result) => {
    console.log("Image uploaded:", result.imageUrl);
    // Store result.imageUrl in your database
  },
  onError: (error) => {
    console.error("Upload failed:", error);
  },
});

// For sign-up (no authentication required)
const signUpImageUpload = useSignUpImageUpload({
  onSuccess: (result) => {
    console.log("Image uploaded:", result.imageUrl);
    // Store result.imageUrl for later use in sign-up
  },
  onError: (error) => {
    console.error("Upload failed:", error);
  },
});

// In JSX
<input
  type="file"
  accept="image/*"
  onChange={imageUpload.handleFileSelect}
  disabled={imageUpload.isUploading}
/>

// Display uploaded image
<UserAvatar
  imageUrl={imageUpload.uploadedImageUrl}
  userName="User Name"
  size="lg"
/>
```

## Migration from R2

If migrating from R2 storage:

1. ✅ Server functions updated to use ImgBB API
2. ✅ Database schema unchanged (still stores image URLs)
3. ✅ UI components simplified (no presigned URLs needed)
4. ✅ Direct URL storage (no key-to-URL conversion)

Existing users with R2 image URLs should continue to work, but new uploads will use ImgBB.

## Authentication Handling

The implementation includes two different server functions to handle authentication properly:

- **Sign-up uploads**: Use `uploadImageForSignUp` - no authentication required since the user isn't registered yet
- **Profile updates**: Use `uploadImageToImgBB` - requires authentication to ensure users can only update their own profiles

This ensures the sign-up flow works correctly without authentication errors while maintaining security for profile updates.
