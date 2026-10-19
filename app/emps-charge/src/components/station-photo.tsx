import {Image} from 'expo-image';
import {useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from 'react-native';
import {ImageIcon} from 'lucide-react-native';
import {useApp} from '@/context/app-context';
import {Colors,Fonts,Radius} from '@/constants/theme';

type PhotoState={key:string;source?:{uri:string;headers?:Record<string,string>};error?:string};
export function StationPhoto({path,compact=false,label='Foto da estação'}:{path?:string;compact?:boolean;label?:string}){
 const {stationPhotoSource,user}=useApp();
 const [attempt,setAttempt]=useState(0);
 const key=JSON.stringify([path,user?.id,attempt]);
 const [resolved,setResolved]=useState<PhotoState|null>(null);
 useEffect(()=>{
  if(!path)return;
  let active=true;
  void stationPhotoSource(path).then(source=>{if(active)setResolved({key,source});})
   .catch(()=>{if(active)setResolved({key,error:'Não foi possível carregar a foto.'});});
  return()=>{active=false;};
 },[path,stationPhotoSource,key]);
 const current=resolved?.key===key?resolved:null;
 const loading=!!path&&!current;
 return <View style={compact?styles.thumbnail:styles.photo} accessibilityLabel={label} accessibilityState={{busy:loading}}>
  {current?.source?<Image accessibilityLabel={label} source={current.source} contentFit="cover" cachePolicy="none" style={StyleSheet.absoluteFill}
   onError={()=>setResolved(value=>value?.key===key?{key,error:'Não foi possível exibir a foto.'}:value)}/>
   :loading?<ActivityIndicator color={Colors.textMuted}/>
   :<View style={[styles.fallback,compact&&styles.compactFallback]}>{(!compact||!current?.error)&&<ImageIcon color={Colors.textFaint} size={compact?22:32}/>}
    {!compact&&<Text style={styles.message}>{current?.error??'Esta estação ainda não tem foto.'}</Text>}
    {current?.error&&<Pressable accessibilityRole="button" accessibilityLabel="Tentar carregar a foto novamente" hitSlop={8} onPress={()=>setAttempt(value=>value+1)} style={[styles.retry,compact&&styles.compactRetry]}><Text style={styles.retryText}>{compact?'↻':'Tentar novamente'}</Text></Pressable>}
   </View>}
 </View>;
}
const styles=StyleSheet.create({
 photo:{width:300,height:185,borderRadius:Radius.medium,backgroundColor:Colors.surfaceSoft,overflow:'hidden',alignItems:'center',justifyContent:'center'},
 thumbnail:{width:46,height:46,borderRadius:14,backgroundColor:Colors.surfaceSoft,overflow:'hidden',alignItems:'center',justifyContent:'center'},
 fallback:{alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:12},
 message:{fontFamily:Fonts.regular,fontSize:12,color:Colors.textMuted,textAlign:'center'},
 compactFallback:{paddingHorizontal:0},
 compactRetry:{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'},
 retry:{paddingHorizontal:10,paddingVertical:5},retryText:{fontFamily:Fonts.medium,fontSize:12,color:Colors.coralText},
});
