import React, { Component } from 'react';
import ride from 'ride';

class God extends Component {
  parseProps = (currentComponent) => {
    let newProps = {}
    for (let key in currentComponent) {
      // console.log(currentComponent[key])
      if (typeof currentComponent[key] === 'function') {
        newProps[key] = '' + currentComponent[key]
      }
      else if (key === 'children') {
        newProps[key] = new currentComponent[key].constructor
        if (Array.isArray(currentComponent[key])) {
          currentComponent[key].forEach(child => {
            newProps[key].push(child.type && child.type.name)
          })
        } else {
          newProps[key].name = currentComponent[key].type && currentComponent[key].type.name
        }
      } else if (typeof currentComponent[key] === 'object') {
        newProps[key] = currentComponent[key]
      } else {
        newProps[key] = currentComponent[key]
      }
    }
    return newProps
  }


  recursiveTraverse = (component, parentArr) => {
    if (!component._currentElement) return
    // console.log('CURRENT COMPONENT: ', component)
    let newComponent = {}
    newComponent.children = []
    newComponent.id = component._debugID
    if (component.constructor.name === 'ReactDOMTextComponent') {
      //current component is a TEXT NODE .. ie. <p>I AM ReactDOMTextComponent</p>
      //do nothing? LINE BELOW IS STILL IN TESTING TO PASS THRU DOM TEXT
      // component = component._renderedComponent
      newComponent.name = component._currentElement
    }
    if (component.constructor.name === 'ReactCompositeComponentWrapper' && component._currentElement.type.name === 'Connect') {
      console.log('THIS IS THE STORE---------------: ', component._instance.store.getState())
      
    }
    if (component.constructor.name === 'ReactDOMComponent') {
      //current component is a DOM node;
      newComponent.name = component._currentElement && component._currentElement.type
      //BELOW IS STILL IN TESTING: trying to grab props and its className from a DOM NODE
      let domProps = component._currentElement.props || null
      newComponent.props = this.parseProps(domProps)
    }

    if (component.constructor.name === 'ReactCompositeComponentWrapper') {
      newComponent.name = component._currentElement && component._currentElement.type && component._currentElement.type.name
      newComponent.state = component && component._instance && component._instance.state || null
      let copyProps = component && component._instance && component._instance.props || null
      newComponent.props = this.parseProps(copyProps)
      newComponent.methods = []
      for (let properties in component._instance) {
        if (typeof component._instance[properties] === 'function' && properties !== 'render') {
          let newObj = {}
          newObj[properties] = "" + component._instance[properties]
          newComponent.methods.push(newObj)
        }
      }
    }
    //go into children of current component
    const componentChildren = component._renderedChildren
    parentArr.push(newComponent);
    if (componentChildren) {
      for (let key in componentChildren) {
        this.recursiveTraverse(componentChildren[key], newComponent.children)
      }
    }
    else if (component._renderedComponent) {
      this.recursiveTraverse(component._renderedComponent, newComponent.children)
    }
  };

  traverseGOD = () => {
    let components = [];
    let dom = this._reactInternalInstance._renderedComponent._renderedChildren['.0']
    this.recursiveTraverse(dom, components)
    console.log('INSIDE TRAVERSE GOD: ', components)
    let data = { data: components }
    console.log('testing stringed expression: ', "" + function() {console.log('123') })
    console.log('This is DE+/serialized data: ', JSON.parse(JSON.stringify(data)))
    window.postMessage(JSON.parse(JSON.stringify(data)), '*')

    return components
  }

  componentDidMount() {
    window.addEventListener('attached', e => {
      console.log('detected event')
      this.traverseGOD()
    })

    ride(React.Component.prototype, 'setState')
      .after(() => {
        this.traverseGOD();
      });

    console.log(this)
    this.traverseGOD()
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

export default God;

// traverseGOD = () => {
//   let components = [];
//   let dom = this._reactInternalInstance._renderedComponent
//   recursiveTraverse(dom, components)
//   top.postMessage({ data: components }, '*')
//   return components
//
//   function recursiveTraverse(component, parentArr) {
//     let newComponent = {}
//
//     if (!component._currentElement) return
//     if (component._closingComment) return // catch bootstrap things
//
//     newComponent.name = component._currentElement && component._currentElement.type.name || component._currentElement.type || 'nothing'
//     newComponent.state = component && component._instance && component._instance.state || null
//     newComponent.children = [];
//
//     const componentChildren = component._renderedChildren
//     parentArr.push(newComponent);
//     if (componentChildren) {
//       for (let key in componentChildren) {
//         recursiveTraverse(componentChildren[key], newComponent.children)
//       }
//     }
//     else if (component._renderedComponent) {
//       recursiveTraverse(component._renderedComponent, newComponent.children)
//     }
//   };
// }
