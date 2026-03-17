
export function normalizeBool(v){
  if(v===true || v==="true" || v==="1") return true
  return false
}

export function normalizeInt(v,min,max,def){

  let n=parseInt(v||0,10)

  if(isNaN(n)) return def

  if(min!==undefined && n<min) n=min
  if(max!==undefined && n>max) n=max

  return n
}

export function normalizeString(v,def){
  const s=String(v||"").trim()
  return s || def
}

