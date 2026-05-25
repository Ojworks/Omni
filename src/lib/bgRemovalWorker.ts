import { removeBackground } from '@imgly/background-removal';

self.onmessage = async (e: MessageEvent) => {
  try {
    const { blob } = e.data;
    // Perform the heavy WASM execution off the main thread
    const resultBlob = await removeBackground(blob);
    self.postMessage({ success: true, blob: resultBlob });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message || 'Unknown error' });
  }
};
