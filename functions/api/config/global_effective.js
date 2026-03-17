import {json} from "../../_lib.js"
import {getEffectiveGlobalSettings} from "./_helper/config_service.js"

export async function onRequestGet({env}){

  const data=await getEffectiveGlobalSettings(env)

  return json(200,"ok",data)
}
