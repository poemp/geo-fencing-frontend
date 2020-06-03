import * as React from 'react';
import styles from './index.module.scss';
import axios from 'axios';
import {Message, Button,Notification} from '@alifd/next';
import url from '@/request';
import {Map, Marker, MouseTool, PolyEditor, Polygon} from 'react-amap';

class Guide extends React.Component {
  constructor(props) {
    super(props);
    const self = this;
    this.state = {
      polygonPath: [],
      markerPosition: [],
      what: '点击下方按钮开始绘制',
      polygonActive: false,
      visible: true,
      position: {longitude: 104.008315, latitude: 30.669832},
      clickable: true,
      draggable: true,
    };
    this.toolEvents = {
      created: (tool) => {
        self.tool = tool;
      },
      draw({obj}) {
        self.drawWhat(obj);
      }
    };
    this.markerEvents = {
      click: (obj) => {
        console.log('marker clicked!',obj)
      },
      //拖拽完成
      dragend:function (obj) {
        console.log('marker dragend!', obj.lnglat);
        self.existsPolygon(obj.lnglat);
      }
    };


    this.editorEvents = {
      //
      created: (ins) => {
        console.log(ins)
      },
      addnode: (ins) => {
        console.log('polyeditor addnode', ins.getPath)
      },
      adjust: (ins) => {
        console.log('polyeditor adjust', ins.getPath)
      },
      removenode: (ins) => {
        console.log('polyeditor removenode', ins.getPath)
      },
      end: (ins) => {
        this.setState({
          polygonPath: ins.target.getPath()
        });
        console.log('polyeditor end', ins.target.getPath())
      },
    };
    this.mapPlugins = ['ToolBar'];
    this.mapCenter = {longitude: 104.008315, latitude: 30.669832};
    this.existsPolygon = this.existsPolygon.bind(this);
  }

  componentWillMount = () => {
    const that = this;
    axios.get(url.url + "/v1/polygons/getPolygonsById?providerId=1")
      .then(function (response) {
        console.log(response.data.polygonsVOS);
        that.setState(
          {
            polygonPath: response.data.polygonsVOS
          }
        )
      })
      .catch(function (error) {
        console.error(error);
        Message.error(error.message);
      });
  };

  /**
   * 是不是存在
   */
  existsPolygon = (obj) => {
    const that = this;
    console.log(obj);
    axios.post(url.url + "/v1/polygons/existPolygons", {
      providerId: 1,
      lng: obj.lng,
      lat: obj.lat,
    })
      .then(function (response) {
        const args = {
          title: '返回消息',
          content:  "经纬度[lng]:" +obj.lng + ", [lat]:"  +  obj.lat +  "，" + "是不是所在区域范围内:" + response.data,
          duration: 4500,
          type:(response.data ? "success":"error")
        };
        Notification.open(args);
        that.setState(
          {
            what: '关闭了鼠标工具',
            polygonActive: false
          }
        )
      })
      .catch(function (error) {
        console.error(error);
        Message.error(error.message);
      });
  };

  /**
   *
   * @param obj
   */
  drawWhat(obj) {
    let text = '';
    switch (obj.CLASS_NAME) {
      case 'AMap.Marker':
        text = `你绘制了一个标记，坐标位置是 {${obj.getPosition()}}`;
        break;
      case 'AMap.Polygon':
        text = `你绘制了一个多边形，有${obj.getPath().length}个端点`;
        this.setState({
          polygonPath: obj.getPath()
        });
        break;
      case 'AMap.Circle':
        text = `你绘制了一个圆形，圆心位置为{${obj.getCenter()}}`;
        break;
      default:
        text = '';
    }
    this.setState({
      what: text
    });
  }


  drawPolygon() {
    if (this.tool) {
      this.tool.polygon();
      this.setState({
        what: '准备绘制多边形',
        polygonActive: true
      });
    }
  }

  /**
   * 画描点
   */
  drawMarker = () => {
    console.log(this.mapCenter);
    this.setState({
      what: '锚点',
      markerPosition: [this.mapCenter],
      polygonActive: true
    });
  };

  close = () => {
    if (this.tool) {
      this.tool.close();
    }
    const obj2 = {provider: 1, polygonsVOS: this.state.polygonPath};
    const that = this;
    axios.post(url.url + "/v1/polygons/saveOrUpdatePolygons", obj2)
      .then(function (response) {
        that.setState(
          {
            what: '关闭了鼠标工具',
            polygonActive: false
          }
        )
      })
      .catch(function (error) {
        console.error(error);
        Message.error(error.message);
      });
  };

  toggleVisible() {
    this.setState({
      visible: !this.state.visible,
    });
  }

  randomPosition() {
    this.setState({
      position: this.mapCenter
    });
  }

  toggleClickable() {
    this.setState({
      clickable: !this.state.clickable,
    });
  }

  toggleDraggable() {
    this.setState({
      draggable: !this.state.draggable,
    });
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.action}>
          <Map zoom={20}
               amapkey={"a1aba2049ce8ef3ed0dd419dd839b4bb"}
               plugins={this.mapPlugins}
               center={this.mapCenter}
          >
            <Marker
              events={this.markerEvents}
              position={this.state.position}
              visible={this.state.visible}
              clickable={this.state.clickable}
              draggable={this.state.draggable}
            />

            <Polygon path={this.state.polygonPath}>
              <PolyEditor active={this.state.polygonActive} events={this.editorEvents}/>
            </Polygon>
            <MouseTool events={this.toolEvents}/>
            <div className={styles.layerStyle}>{this.state.what}</div>
          </Map>
        </div>
        <div style={{marginTop: "5px", marginBottom: "5px"}}>
          <Button type="normal" onClick={() => {
            this.toggleVisible()
          }}>可视化</Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.randomPosition()
          }}>定位</Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.toggleClickable()
          }}>回调</Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.toggleDraggable()
          }}>拖拽</Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.drawMarker()
          }}>开始编辑坐标
          </Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.drawPolygon()
          }}>开始编辑围栏
          </Button>&nbsp;&nbsp;
          <Button type="normal" onClick={() => {
            this.close()
          }}>结束编辑围栏
          </Button>&nbsp;&nbsp;
        </div>
      </div>
    )
  }
}

export default Guide;
