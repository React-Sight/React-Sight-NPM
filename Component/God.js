import React, { Component } from 'react';
import ride from 'ride';

class God extends Component {
  traverseGOD = () => {
    let components = [];
    let dom = this._reactInternalInstance._renderedComponent

    recursiveTraverse(dom, components)
    console.log('return')
    console.log(components)
    return components

    function recursiveTraverse(component, parentArr) {
      let newComponent = {}
      if (!component._currentElement) return
      newComponent.name = component._currentElement.type.name || component._currentElement.type
      newComponent.children = [];

      // print the state of stateful components
      if (component) {
        if (component._instance) {
          if (component._instance.state) {
            console.log('STATE !!!!!', component._instance.state)
          }    
        }
      }


      const componentChildren = component._renderedChildren
      parentArr.push(newComponent);
      if (componentChildren) {
        for (let key in componentChildren) {
          recursiveTraverse(componentChildren[key], newComponent.children)
        }
      }
      else if (component._renderedComponent) {
        recursiveTraverse(component._renderedComponent, newComponent.children)
      }
    };
  }

  componentDidMount() {
    ride(React.Component.prototype, 'setState')
      .after(() => {
        this.traverseGOD()
      });
    console.log(this)
  }

  componentDidUpdate() {
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
