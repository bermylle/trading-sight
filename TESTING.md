# Testing the Trading Sight Demo

## Quick Start

### Method 1: Direct Browser Testing (Recommended)
1. **Open the demo file directly in your browser:**
   - Navigate to the `demo/index.html` file
   - Double-click to open it in your default browser
   - **No build tools or server required!**

2. **What you'll see:**
   - A dark-themed chart with 2000 sample OHLC candles
   - Real-time FPS counter in the top-left
   - Statistics showing zoom level, offset, and visible range
   - Interactive controls at the bottom

### Method 2: Local Server (Optional)
If you prefer to serve it via a local server:

```bash
# Navigate to the project directory
cd trading-sight

# Start a simple HTTP server (Python 3)
python -m http.server 8000

# Or with Python 2
python -m SimpleHTTPServer 8000

# Or with Node.js (if available)
npx http-server -p 8000

# Then open: http://localhost:8000/demo/index.html
```

## Interactive Features to Test

### 🎛️ **Controls**
- **Zoom In/Out Buttons**: Click the buttons to change zoom levels
- **Reset Zoom**: Returns to default zoom and center position
- **Scroll Wheel**: Zoom in/out smoothly (most responsive)

### 🖱️ **Mouse Interactions**
- **Click & Drag**: Pan the chart horizontally
- **Scroll**: Zoom in/out around the mouse cursor position

### 📊 **Visual Elements**
- **Green Candles**: Bullish (close ≥ open)
- **Red Candles**: Bearish (close < open)
- **White Wicks**: High-low range
- **Grid Lines**: Price levels for reference
- **FPS Counter**: Real-time performance monitoring

## Performance Testing

### 📈 **FPS Monitoring**
- Watch the FPS counter in the top-left
- Should maintain 60 FPS on modern devices
- Performance degrades gracefully on older hardware

### 🔄 **Data Processing**
- Open browser developer tools (F12)
- Check the console for any errors
- Monitor memory usage while zooming/panning

### 📱 **Responsive Testing**
- Resize your browser window
- Chart should automatically adjust to new dimensions
- DPI scaling should work on high-resolution displays

## Expected Behavior

### ✅ **What Should Work**
- Smooth 60 FPS rendering
- Responsive zoom and pan interactions
- Real-time statistics updates
- Proper candlestick rendering (green/red)
- Grid lines and axis labels
- FPS counter display

### ⚠️ **Known Limitations**
- Demo uses simplified coordinate manager (not the full TypeScript implementation)
- No real-time data streaming
- Limited to 2000 sample candles
- Basic grid line calculation

## Troubleshooting

### ❌ **If Demo Doesn't Load**
1. **Check file path**: Ensure `demo/index.html` exists
2. **Browser compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)
3. **File permissions**: Ensure the file is readable
4. **Console errors**: Open browser dev tools (F12) and check console

### 🐛 **If Performance is Poor**
1. **Close other tabs**: Free up browser resources
2. **Check device**: Older devices may struggle with 60 FPS
3. **Reduce data**: The demo uses 2000 candles (modify in code if needed)

### 🔧 **If Interactions Don't Work**
1. **Mouse events**: Ensure mouse is working properly
2. **Browser settings**: Check for any browser extensions interfering
3. **Canvas support**: Verify your browser supports HTML5 Canvas

## Advanced Testing

### 🧪 **Stress Testing**
- Rapid zooming in and out
- Fast panning across the chart
- Window resizing while interacting
- Long-duration rendering (leave running for several minutes)

### 📐 **Coordinate Accuracy**
- Zoom to maximum level and verify candles remain crisp
- Pan to edges and ensure no rendering artifacts
- Check that grid lines align properly with price levels

### 🎨 **Visual Quality**
- Verify candle colors are correct (green up, red down)
- Check that wicks are properly drawn
- Ensure grid lines are evenly spaced
- Validate axis labels are readable

## Next Steps

Once you've tested the demo:

1. **Explore the source code**: Check out the TypeScript implementations in `src/core/`
2. **Build the full project**: If you have Node.js/npm available, run `npm install` and `npm run dev`
3. **Customize the demo**: Modify the sample data or styling in `demo/index.html`
4. **Extend functionality**: Add new features using the modular architecture

The demo serves as both a working example and a testing ground for the core charting engine functionality!