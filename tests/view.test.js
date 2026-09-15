import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportSize,worldToView,viewToWorld,pointerToWorld,setWorldTransform} from '../src/view.js';
import {WIDTH,HEIGHT} from '../src/sim.js';
test('portrait shows the full identical world and has a true inverse pointer transform',()=>{
  for(const portrait of [false,true]){
    const size=viewportSize(portrait);
    for(const point of [{x:0,y:0},{x:WIDTH,y:HEIGHT},{x:185,y:300},{x:742.5,y:123.75}]){
      const view=worldToView(point,portrait);
      assert.ok(view.x>=0&&view.x<=size.width&&view.y>=0&&view.y<=size.height);
      assert.deepEqual(viewToWorld(view,portrait),point);
      for(const pixels of [350,768,1440]){
        const rect={left:21,top:143,width:pixels,height:pixels*size.height/size.width};
        const back=pointerToWorld({x:rect.left+view.x*rect.width/size.width,y:rect.top+view.y*rect.height/size.height},rect,portrait);
        assert.ok(Math.hypot(back.x-point.x,back.y-point.y)<1e-9);
      }
    }
  }
});
test('render matrix is exactly the input coordinate transform at high DPI',()=>{
  for(const portrait of [false,true])for(const pixels of [700,1440]){
    let matrix;setWorldTransform({setTransform:(...m)=>matrix=m},pixels,portrait);
    const [a,b,c,d,e,f]=matrix,point={x:186,y:393},view=worldToView(point,portrait),scale=pixels/viewportSize(portrait).width;
    assert.ok(Math.abs(a*point.x+c*point.y+e-view.x*scale)<1e-9);
    assert.ok(Math.abs(b*point.x+d*point.y+f-view.y*scale)<1e-9);
  }
});
