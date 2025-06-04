"""
Script to download and set up the Whisper model for offline use.

This script downloads the specified Whisper model size and saves it locally
so it can be used for offline transcription with filler word detection.
"""
import os
import logging
import argparse
import whisper # type: ignore

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def download_whisper_model(model_size='small'):
    """Download and cache a Whisper model for offline use."""
    try:
        logging.info(f"Downloading Whisper model: {model_size}")
        # This will download the model if not already cached
        model = whisper.load_model(model_size)
        
        # Get the model's cache directory
        import torch
        cache_dir = os.path.join(os.path.expanduser('~'), '.cache', 'whisper')
        os.makedirs(cache_dir, exist_ok=True)
        
        logging.info(f"Whisper model '{model_size}' downloaded successfully")
        logging.info(f"Model cached at: {cache_dir}")
          # Return model info for verification
        model_info = {
            "model_size": model_size,
            "cache_dir": cache_dir,
            "is_multilingual": model.is_multilingual
        }
        
        # Add additional properties if they exist
        if hasattr(model, 'dimensions'):
            model_info["dimensions"] = model.dimensions
        if hasattr(model, 'vocab_size'):
            model_info["vocab_size"] = model.vocab_size
            
        return model_info
    
    except Exception as e:
        logging.error(f"Error downloading Whisper model: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description="Download Whisper models for offline use")
    parser.add_argument(
        "--model-size", 
        default="small", 
        choices=["tiny", "base", "small", "medium", "large"],
        help="The size of the Whisper model to download (default: small)"
    )
    args = parser.parse_args()
    
    try:
        model_info = download_whisper_model(args.model_size)
        logging.info(f"Model information: {model_info}")
        logging.info(f"Model downloaded and ready for use")
    except Exception as e:
        logging.error(f"Model download failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
