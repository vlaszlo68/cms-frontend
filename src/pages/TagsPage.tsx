import { useEffect, useState, type FormEvent } from "react";
import * as api from "../api/contentApi";
import { ApiError } from "../api/httpClient";
import { useSiteContext } from "../sites/SiteContext";
import type { Tag } from "../models/content";
const message=(e:unknown)=>e instanceof ApiError?e.message:"Tags could not be saved.";
export default function TagsPage(){
 const {selectedSite}=useSiteContext(); const [items,setItems]=useState<Tag[]>([]),[code,setCode]=useState(""),[name,setName]=useState(""),[edit,setEdit]=useState<Tag|null>(null),[error,setError]=useState("");
 const load=async()=>{if(!selectedSite)return;try{setItems(await api.getTags(selectedSite.code));}catch(e){setError(message(e));}}; useEffect(()=>{void load();},[selectedSite?.code]);
 const save=async(e:FormEvent)=>{e.preventDefault();if(!selectedSite)return;try{if(edit)await api.updateTag(selectedSite.code,edit.id,{code,name});else await api.createTag(selectedSite.code,{code,name});setCode("");setName("");setEdit(null);void load();}catch(e){setError(message(e));}};
 const remove=async(item:Tag)=>{if(!selectedSite||!confirm(`Delete ${item.name}?`))return;try{await api.deleteTag(selectedSite.code,item.id);void load();}catch(e){setError(message(e));}};
 return <section className="users-page"><div className="page-heading"><div><h2>Tags</h2><p>Site-scoped labels for content.</p></div></div>{error&&<div className="error-message">{error}</div>}<form className="user-form" onSubmit={save}><label>Code<input required pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*" value={code} onChange={e=>setCode(e.target.value)}/></label><label>Name<input required value={name} onChange={e=>setName(e.target.value)}/></label><div className="form-actions"><button type="submit">{edit?"Save tag":"Create tag"}</button>{edit&&<button className="secondary-button" type="button" onClick={()=>{setEdit(null);setCode("");setName("");}}>Cancel</button>}</div></form><div className="users-table-wrap"><table className="users-table"><thead><tr><th>Code</th><th>Name</th><th>Actions</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.code}</td><td>{x.name}</td><td><button className="secondary-button" onClick={()=>{setEdit(x);setCode(x.code);setName(x.name);}} type="button">Edit</button> <button className="danger-button" onClick={()=>void remove(x)} type="button">Delete</button></td></tr>)}</tbody></table>{!items.length&&<div className="inline-status">No tags found.</div>}</div></section>;
}
