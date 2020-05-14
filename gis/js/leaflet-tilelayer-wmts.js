L.TileLayer.WMTS=L.TileLayer.extend({defaultWmtsParams:{service:"WMTS",request:"GetTile",version:"1.0.0",layer:"",style:"",tilematrixset:"",format:"image/jpeg"},initialize:function(t,i){this._url=t;var e={};Object.keys(i).forEach(function(t){e[t.toLowerCase()]=i[t]});var r=L.extend({},this.defaultWmtsParams),s=e.tileSize||this.options.tileSize;for(var a in r.width=e.detectRetina&&L.Browser.retina?r.height=2*s:r.height=s,e)r.hasOwnProperty(a)&&"matrixIds"!=a&&(r[a]=e[a]);this.wmtsParams=r,this.matrixIds=i.matrixIds||this.getDefaultMatrix(),L.setOptions(this,i)},onAdd:function(t){this._crs=this.options.crs||t.options.crs,L.TileLayer.prototype.onAdd.call(this,t)},getTileUrl:function(t){var i=this.options.tileSize,e=t.multiplyBy(i);e.x+=1,e.y-=1;var r=e.add(new L.Point(i,i)),s=this._tileZoom,a=this._crs.project(this._map.unproject(e,s)),n=this._crs.project(this._map.unproject(r,s));tilewidth=n.x-a.x;var o=this.matrixIds[s].identifier,l=this.wmtsParams.tilematrixset+":"+o,h=this.matrixIds[s].topLeftCorner.lng,m=this.matrixIds[s].topLeftCorner.lat,d=Math.floor((a.x-h)/tilewidth),c=-Math.floor((a.y-m)/tilewidth),f=L.Util.template(this._url,{s:this._getSubdomain(t)});return f+L.Util.getParamString(this.wmtsParams,f)+"&tilematrix="+l+"&tilerow="+c+"&tilecol="+d},setParams:function(t,i){return L.extend(this.wmtsParams,t),i||this.redraw(),this},getDefaultMatrix:function(){for(var t=Array(22),i=0;22>i;i++)t[i]={identifier:""+i,topLeftCorner:new L.LatLng(20037508.3428,-20037508.3428)};return t}}),L.tileLayer.wmts=function(t,i){return new L.TileLayer.WMTS(t,i)};