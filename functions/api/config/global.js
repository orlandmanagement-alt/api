import {json,requireAuth,hasRole,readJson} from "../../_lib.js"
import {getGlobalSettings,saveGlobalSettings} from "./_helper/config_service.js"

function canManage(roles){
  return hasRole(roles,["super_admin","admin"])
}

export async function onRequestGet({request,env}){

  const a=await requireAuth(env,request)
  if(!a.ok) return a.res

  if(!canManage(a.roles))
    return json(403,"forbidden",null)

  const data=await getGlobalSettings(env)

  return json(200,"ok",data)
}

export async function onRequestPost({request,env}){

  const a=await requireAuth(env,request)
  if(!a.ok) return a.res

  if(!canManage(a.roles))
    return json(403,"forbidden",null)

  const body=await readJson(request)||{}

  const r=await saveGlobalSettings(env,body,a.uid||null)

  return json(200,"ok",r)
}
