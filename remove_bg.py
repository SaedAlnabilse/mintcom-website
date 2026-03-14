import sys
from PIL import Image
import numpy as np

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Get dimensions
    h, w = data.shape[:2]
    
    # Create alpha mask - start fully opaque
    alpha = np.ones((h, w), dtype=np.uint8) * 255
    
    # Step 1: Mark very dark pixels as transparent
    # The background is black/near-black, the shadow is dark gray
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
    
    # Threshold: pixels darker than 25 brightness are background
    dark_mask = brightness < 25
    
    # Step 2: Flood fill from edges to only remove CONNECTED dark regions
    # This prevents removing dark pixels inside the iPad (like the sidebar)
    from scipy import ndimage
    
    # Create border seed mask
    border_mask = np.zeros((h, w), dtype=bool)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True
    
    # Seeds are border pixels that are dark
    seeds = border_mask & dark_mask
    
    # Label connected components of dark pixels
    labeled, num_features = ndimage.label(dark_mask)
    
    # Find which labels touch the border (are background)
    border_labels = set(np.unique(labeled[seeds]))
    border_labels.discard(0)  # 0 means not dark
    
    # Create final background mask - only dark regions connected to border
    bg_mask = np.zeros((h, w), dtype=bool)
    for label in border_labels:
        bg_mask |= (labeled == label)
    
    # Step 3: Also remove the shadow (slightly brighter dark areas connected to bg)
    shadow_dark = brightness < 45
    shadow_labeled, shadow_features = ndimage.label(shadow_dark)
    shadow_seeds = border_mask & shadow_dark
    shadow_labels = set(np.unique(shadow_labeled[shadow_seeds]))
    shadow_labels.discard(0)
    
    shadow_mask = np.zeros((h, w), dtype=bool)
    for label in shadow_labels:
        shadow_mask |= (shadow_labeled == label)
    
    # Apply: make background fully transparent
    alpha[bg_mask] = 0
    
    # For shadow areas not in the main bg, apply soft transparency
    shadow_only = shadow_mask & ~bg_mask
    alpha[shadow_only] = 0
    
    # Step 4: Smooth the edges slightly for anti-aliasing
    from scipy.ndimage import gaussian_filter
    alpha_float = alpha.astype(float)
    # Only blur near edges (where alpha transitions)
    edge_region = gaussian_filter((alpha > 0).astype(float), sigma=1.0)
    is_edge = (edge_region > 0.01) & (edge_region < 0.99)
    alpha_blurred = gaussian_filter(alpha_float, sigma=0.8)
    alpha_float[is_edge] = alpha_blurred[is_edge]
    alpha = np.clip(alpha_float, 0, 255).astype(np.uint8)
    
    # Apply alpha
    data[:,:,3] = alpha
    
    result = Image.fromarray(data)
    result.save(output_path, "PNG")
    print(f"Done! Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_background(sys.argv[1], sys.argv[2])
