import {useEffect,useState} from 'react';
import {appearanceKey,parseAppearance,resolveAppearance,paletteFor,presetFor,type Appearance} from './theme';
function read(){try{return parseAppearance(localStorage.getItem(appearanceKey));}catch{return 'system' as const;}}
function apply(preference:Appearance){
 const resolved=resolveAppearance(preference,matchMedia('(prefers-color-scheme: dark)').matches),preset=presetFor(resolved),root=document.documentElement;
 root.dataset.theme=preset.mode;root.dataset.preset=resolved;root.style.colorScheme=preset.mode;
 const tokens={canvas:preset.background,surface:preset.surface,'surface-soft':preset.soft,'surface-hover':`color-mix(in srgb, ${preset.soft}, ${preset.foreground} 8%)`,text:preset.foreground,accent:preset.accent,'accent-soft':`color-mix(in srgb, ${preset.background}, ${preset.accent} 16%)`,terminal:preset.background,focus:preset.accent};
 for(const [key,value] of Object.entries(tokens))root.style.setProperty('--'+key,value);
 return resolved;
}
apply(read());
export function terminalTheme(){return paletteFor(resolveAppearance(parseAppearance(document.documentElement.dataset.preset),false));}
export function useAppearance(){
 const [preference,setPreference]=useState<Appearance>(read);
 const [resolved,setResolved]=useState(()=>apply(preference));
 useEffect(()=>{setResolved(apply(preference));const media=matchMedia('(prefers-color-scheme: dark)');const update=()=>setResolved(apply(preference));media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[preference]);
 const choose=(next:Appearance)=>{setPreference(next);setResolved(apply(next));try{localStorage.setItem(appearanceKey,next);}catch{}};
 return {preference,resolved,choose};
}
