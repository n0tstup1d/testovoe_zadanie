figma.showUI(__html__, {width:1100,height:760,themeColors:true});
figma.ui.postMessage({type:'host-ready'});
figma.ui.onmessage=async function(message){
 try{
  if(message.type==='hello')figma.ui.postMessage({type:'host-ready'});
  if(message.type==='insert'){
   if(typeof message.svg!=='string'||message.svg.length>8000000)throw Error('Некорректный SVG.');
   const frame=figma.createNodeFromSvg(message.svg);frame.name='Композиция · '+message.label;frame.clipsContent=true;
   frame.x=figma.viewport.center.x-frame.width/2;frame.y=figma.viewport.center.y-frame.height/2;
   frame.setPluginData('illustration-composer','1');figma.currentPage.selection=[frame];figma.viewport.scrollAndZoomIntoView([frame]);
   figma.ui.postMessage({type:'success',text:'Композиция добавлена. Объекты можно редактировать средствами Figma.'});
  }
  if(message.type==='export-selection'){
   const nodes=figma.currentPage.selection;if(nodes.length!==1)throw Error('Выдели один фрейм с готовой композицией.');
   const bytes=await nodes[0].exportAsync({format:'SVG',svgIdAttribute:true,svgOutlineText:false});
   figma.ui.postMessage({type:'exported',bytes:Array.from(bytes)});
  }
 }catch(error){figma.ui.postMessage({type:'error',text:error.message||String(error)});}
};
