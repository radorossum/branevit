window.onload = () => {
    // Setup Paper
    p=paper;
    paper.setup(document.querySelector('canvas'))
      
    // Find a Tool in `paper.tools` and activate it
  
    const activateTool = name => {
      const tool = paper.tools.find(tool => tool.name === name)
      tool.activate()
    }
  
    // Tool Path, draws paths on mouse-drag.
    // Note: Wrap each Tool in an IIFE to avoid polluting the 
    //       global scope with variables related with that Tool.
  
    ;(() => {
      const tool = new paper.Tool()
      tool.name = 'toolPath'
  
      let path
  
      tool.onMouseDown = (e)=> {
        path = new paper.Path()
        path.strokeColor = '#424242'
        path.strokeWidth = 4
        path.add(e.point)
      }
  
      tool.onMouseDrag = function(event) {
        path.add(event.point)
      }

      
    })()
  
    // Tool Circle, draws a 30px circle on mousedown
  
    ;(() => {
      const tool = new paper.Tool()
      tool.name = 'toolCircle'
  
      let path
  
      tool.onMouseDown = function(event) {
        path = new paper.Path.Circle({
          center: event.point,
          radius: 30,
          fillColor: '#9C27B0'
        })
      }
    })()
  
    // Attach click handlers for Tool activation on all
    // DOM buttons with class '.tool-button'
  
    document.querySelectorAll('.tool-button').forEach(toolBtn => {
      toolBtn.addEventListener('click', e => {
        activateTool(e.target.getAttribute('data-tool-name'))
      })
    })
  }