/**
 * ShareMyImage API Integration
 * Uploads images to ShareMyImage.com using their Chevereto-based API
 * 
 * API Docs: https://v4-docs.chevereto.com/api/1/file-upload.html
 */

const SHAREMYIMAGE_API_URL = 'https://www.sharemyimage.com/api/1/upload'
const SHAREMYIMAGE_API_KEY = process.env.SHAREMYIMAGE_API_KEY || ''

export interface ShareMyImageResponse {
    status_code: number
    success?: {
        message: string
        code: number
    }
    image?: {
        name: string
        extension: string
        width: number
        height: number
        url: string
        url_viewer: string
        thumb?: {
            url: string
        }
        medium?: {
            url: string
        }
    }
    error?: {
        message: string
        code: number
    }
    status_txt: string
}

/**
 * Upload an image to ShareMyImage
 * @param imageData - Base64 encoded image data (without data:image prefix) or URL
 * @param title - Optional title for the image
 * @returns The uploaded image data including URL
 */
export async function uploadToShareMyImage(
    imageData: string,
    title?: string
): Promise<{ url: string; thumbUrl?: string; viewerUrl?: string }> {
    if (!SHAREMYIMAGE_API_KEY) {
        throw new Error('SHAREMYIMAGE_API_KEY not configured in environment')
    }

    const formData = new FormData()

    // Check if it's a URL or base64
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        formData.append('source', imageData)
    } else {
        // Remove data:image prefix if present
        const base64Clean = imageData.replace(/^data:image\/\w+;base64,/, '')
        formData.append('source', base64Clean)
    }

    if (title) {
        formData.append('title', title)
    }

    formData.append('format', 'json')

    const response = await fetch(SHAREMYIMAGE_API_URL, {
        method: 'POST',
        headers: {
            'X-API-Key': SHAREMYIMAGE_API_KEY
        },
        body: formData
    })

    const data: ShareMyImageResponse = await response.json()

    if (data.status_code !== 200 || !data.image) {
        throw new Error(data.error?.message || 'Failed to upload image to ShareMyImage')
    }

    return {
        url: data.image.url,
        thumbUrl: data.image.thumb?.url,
        viewerUrl: data.image.url_viewer
    }
}

/**
 * Upload image from a Blob/File
 */
export async function uploadBlobToShareMyImage(
    blob: Blob,
    title?: string
): Promise<{ url: string; thumbUrl?: string; viewerUrl?: string }> {
    if (!SHAREMYIMAGE_API_KEY) {
        throw new Error('SHAREMYIMAGE_API_KEY not configured in environment')
    }

    const formData = new FormData()
    formData.append('source', blob, 'image.png')

    if (title) {
        formData.append('title', title)
    }

    formData.append('format', 'json')

    const response = await fetch(SHAREMYIMAGE_API_URL, {
        method: 'POST',
        headers: {
            'X-API-Key': SHAREMYIMAGE_API_KEY
        },
        body: formData
    })

    const data: ShareMyImageResponse = await response.json()

    if (data.status_code !== 200 || !data.image) {
        throw new Error(data.error?.message || 'Failed to upload image to ShareMyImage')
    }

    return {
        url: data.image.url,
        thumbUrl: data.image.thumb?.url,
        viewerUrl: data.image.url_viewer
    }
}
