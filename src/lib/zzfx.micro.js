
// ZzFX - Zuper Zmall Zound Zynth - Micro Edition
// MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

// This is a tiny build of zzfx with only a zzfx function to play sounds.
// You can use zzfxV to set volume.
// There is a small bit of optional code to improve compatibility.
// Feel free to minify it further for your own needs!

'use strict';
const zzfxV=.3    // volume
const zzfxX=new(window.AudioContext||webkitAudioContext) // audio context
const zzfxR=44100 // sample rate

export function zzfxCreateBuffer( RNG,p=1,k=.05,b=220,e=0,r=0,t=.1,q=0,D=1,u=0,y=0,v=0,z=0,l=0,E=0,A=0,F=0,c=0,w=1,m=0,B=0 ){
    let d=2*Math.PI,G=u*=500*d/194481E4,C=b*=(1+2*k*RNG()-k)*d/44100;k=[];let g=0,H=0,a=0,n=1,I=0,J=0,f=0,x,h;e=44100*e+9;m*=44100;r*=44100;t*=44100;c*=44100;y*=500*d/44100**3;A*=d/44100;v*=d/44100;z*=44100;l=44100*l|0;for(h=e+m+r+t+c|0;a<h;k[a++]=f)++J%(100*F|0)||(f=q?1<q?2<q?3<q?Math.sin((g%d)**3):Math.max(Math.min(Math.tan(g),1),-1):1-(2*g/d%2+2)%2:1-4*Math.abs(Math.round(g/d)-g/d):Math.sin(g),f=(l?1-B+B*Math.sin(2*Math.PI*a/l):1)*(0<f?1:-1)*Math.abs(f)**D*p*zzfxV*(a<e?a/e:a<e+m?1-(a-e)/m*(1-w):a<e+m+r?w:a<h-c?(h-a-c)/t*w:0),f=c?f/2+(c>a?0:(a<h-c?1:(h-a)/c)*k[a-c|0]/2):f),x=(b+=u+=y)*Math.cos(A*H++),g+=x-x*E*(1-1E9*(Math.sin(a)+1)%2),n&&++n>z&&(b+=v,C+=v,n=0),!l||++I%l||(b=C,u=G,n=n||1);p=zzfxX.createBuffer(1,h,44100);p.getChannelData(0).set(k);
    return p   
}
