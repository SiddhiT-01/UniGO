// src/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import RideModal from './RideModal';
import { UniGoLogo } from './UniGoLogo'; 
import { auth, db } from './firebase';
import { collection, query, orderBy, onSnapshot, limit, addDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { LogOut, Bell, Zap, MessageSquare, Home, Plus, Car, Coffee, AlertTriangle, Search, Trash2, Edit2, User, MapPin, Camera, Save, X, Send, Clock, RefreshCw, CheckCircle2, Utensils, Check, MessageCircle, ChevronLeft } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('HOME');
  const [showModal, setShowModal] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // NEW: State for Private Chat
  const [currentChat, setCurrentChat] = useState(null); // { id: 'userA_userB', name: 'Rohan', recipientId: 'xyz' }

  const [userProfile, setUserProfile] = useState({
    customName: user.displayName,
    photoURL: user.photoURL,
    bio: "Student at Uni",
    major: "Undeclared",
    year: "1st Year"
  });

  // Fetch Data
  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserProfile({ ...userProfile, ...docSnap.data() });
    };
    fetchProfile();
  }, [user.uid]);

  // Actions
  const handleDelete = async (id) => { if (window.confirm("Delete this?")) await deleteDoc(doc(db, "requests", id)); };
  const handleEdit = (req) => { setRequestToEdit(req); setShowModal(true); };
  const openNewRequest = () => { setRequestToEdit(null); setShowModal(true); };
  
  const handleJoin = async (req) => {
    const isJoined = req.participants?.includes(user.uid);
    const reqRef = doc(db, "requests", req.id);
    try {
      if (isJoined) {
        if (!window.confirm("Cancel your booking?")) return;
        await updateDoc(reqRef, { participants: arrayRemove(user.uid) });
      } else {
        await updateDoc(reqRef, { participants: arrayUnion(user.uid) });
        // Auto-open chat on join
        handleConnect(req); 
      }
    } catch (e) { alert(e.message); }
  };

  // 🔥 NEW: START PRIVATE CHAT FUNCTION
  const handleConnect = (req) => {
    // 1. Determine the other person
    const isMe = req.requesterId === user.uid;
    // If I am the owner, I can't chat with myself (logic for listing participants would go here in a full app)
    // For this hackathon, "Connect" always chats with the REQUEST OWNER
    if (isMe) {
        alert("You created this request! Wait for others to message you."); 
        return;
    }

    const partnerId = req.requesterId;
    const partnerName = req.requesterName;
    
    // 2. Create Unique Chat ID (Alphabetical Order ensures UserA_UserB is same as UserB_UserA)
    const chatId = [user.uid, partnerId].sort().join("_");

    // 3. Open Chat
    setCurrentChat({ id: chatId, name: partnerName, partnerId: partnerId });
    setActiveTab('CHAT');
  };

  const handleSOS = async () => {
    if (!window.confirm("🚨 SEND PRIORITY EMERGENCY ALERT?")) return;
    try {
      await addDoc(collection(db, "requests"), { type: "SOS", status: "CRITICAL", requesterId: user.uid, requesterName: userProfile.customName || user.displayName, title: "🚨 URGENT: SOS HELP!", description: "Emergency! High Priority Assistance Needed.", location: [19.0760 + (Math.random()-0.5)*0.005, 72.8777 + (Math.random()-0.5)*0.005], isPriority: true, createdAt: serverTimestamp() });
      alert("PRIORITY ALERT SENT!");
    } catch (e) { alert(e.message); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'CHAT': return <ChatPage user={user} userProfile={userProfile} currentChat={currentChat} setCurrentChat={setCurrentChat} requests={requests} />;
      case 'ACTIVITY': return <ActivityPage user={user} requests={requests} handleDelete={handleDelete} handleEdit={handleEdit} />;
      case 'PROFILE': return <ProfilePage user={user} requests={requests} userProfile={userProfile} setUserProfile={setUserProfile} />;
      default: return <HomeFeed user={user} requests={requests} filter={filter} setFilter={setFilter} searchText={searchText} setSearchText={setSearchText} handleDelete={handleDelete} handleEdit={handleEdit} handleSOS={handleSOS} openNewRequest={openNewRequest} handleJoin={handleJoin} handleConnect={handleConnect} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans pb-24 relative selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER */}
      <div className="sticky top-0 z-[1000] bg-white/90 backdrop-blur-xl px-4 pt-10 pb-3 border-b border-gray-200/50 flex justify-between items-center shadow-sm">
        <div className="w-10"></div>
        <div onClick={() => setActiveTab('HOME')} className="cursor-pointer hover:opacity-80 transition"><UniGoLogo className="h-9 w-auto" /></div>
        <div className="w-10 flex justify-end relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-white border border-gray-100 rounded-full shadow-sm text-gray-600 relative hover:bg-gray-50 transition active:scale-95">
            <Bell size={20} />
            {requests.some(r => r.type === 'SOS') && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>}
          </button>
          {showNotifications && (
            <div className="absolute top-14 right-[-10px] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-0 z-[1001] animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Smart Alerts</p><button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button></div>
                <div className="max-h-72 overflow-y-auto">
                  {requests.slice(0, 5).map(r => (
                    <div key={r.id} className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start hover:bg-gray-50 transition ${r.type === 'SOS' ? 'bg-red-50/50' : ''}`}>
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${r.type === 'SOS' ? 'bg-red-500 animate-pulse' : (r.type === 'RIDE' ? 'bg-indigo-500' : 'bg-orange-500')}`}></div>
                      <div className="flex-1"><p className="text-xs text-gray-800 leading-snug"><span className="font-bold">{r.requesterName?.split(' ')[0]}</span> {r.type === 'SOS' ? ' triggered SOS!' : `: ${r.title}`}</p><p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10}/> {r.time || "Just now"}</p></div>
                    </div>
                  ))}
                  {requests.length === 0 && <div className="p-4 text-center text-xs text-gray-400">No new alerts</div>}
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-6 relative z-0">{renderContent()}</div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-3 z-[999] flex justify-between items-center">
        <NavBtn id="home-btn" icon={<Home size={24} />} active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
        <NavBtn icon={<Zap size={24} />} active={activeTab === 'ACTIVITY'} onClick={() => setActiveTab('ACTIVITY')} />
        <button onClick={openNewRequest} className="relative -top-10 h-16 w-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full text-white shadow-xl shadow-indigo-300 flex items-center justify-center transform hover:scale-110 transition border-[6px] border-[#F3F4F6]"><Plus size={32} /></button>
        <NavBtn icon={<MessageSquare size={24} />} active={activeTab === 'CHAT'} onClick={() => setActiveTab('CHAT')} />
        <NavBtn icon={<User size={24} />} active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} />
      </div>

      <RideModal isOpen={showModal} onClose={() => setShowModal(false)} user={user} requestToEdit={requestToEdit} userProfile={userProfile} />
    </div>
  );
};

// ================== SUB-COMPONENTS ==================

// --- 🔥 NEW PRIVATE CHAT COMPONENT ---
const ChatPage = ({ user, userProfile, currentChat, setCurrentChat, requests }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  // 1. Identify active contacts based on requests user is involved in
  const activeContacts = requests.filter(r => 
    (r.requesterId === user.uid && r.participants?.length > 0) || // I requested, someone joined
    (r.participants?.includes(user.uid)) // I joined someone else's
  ).map(r => ({
    // If I am requester, chat with first participant (simplified). If I joined, chat with requester.
    uid: r.requesterId === user.uid ? r.participants[0] : r.requesterId,
    name: r.requesterId === user.uid ? "Participant" : r.requesterName,
    reqTitle: r.title
  }));

  // Remove duplicates
  const uniqueContacts = [...new Map(activeContacts.map(item => [item.uid, item])).values()];

  useEffect(() => {
    if (!currentChat) return;
    
    // Query messages specifically for THIS chat ID (userA_userB)
    const q = query(
        collection(db, "chats", currentChat.id, "messages"), 
        orderBy("createdAt", "asc"), 
        limit(50)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [currentChat]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;
    
    // Save to sub-collection: chats -> [chatID] -> messages
    await addDoc(collection(db, "chats", currentChat.id, "messages"), {
      text: input, 
      uid: user.uid, 
      displayName: userProfile.customName || user.displayName, 
      createdAt: serverTimestamp()
    });
    setInput('');
  };

  // --- VIEW 1: CONTACT LIST (If no chat selected) ---
  if (!currentChat) {
      return (
        <div className="flex flex-col h-[75vh] bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Messages</h2>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{uniqueContacts.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {uniqueContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <MessageSquare size={32} className="text-indigo-300"/>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">No Active Chats</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
                            Chats start automatically when you <b>Book a Ride</b> or <b>Accept a Request</b> from the Home Feed.
                        </p>
                        <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200" onClick={() => document.getElementById('home-btn').click()}>
                            Go to Feed
                        </button>
                    </div>
                ) : (
                    uniqueContacts.map(contact => (
                        <button 
                            key={contact.uid} 
                            onClick={() => setCurrentChat({ 
                                id: [user.uid, contact.uid].sort().join("_"), 
                                name: contact.name 
                            })}
                            className="w-full text-left p-4 hover:bg-gray-50 rounded-2xl transition flex items-center gap-4 border-b border-gray-50/50 group"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition">
                                {contact.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition">{contact.name}</h4>
                                <p className="text-xs text-gray-500 truncate w-48 font-medium">Connected via: {contact.reqTitle}</p>
                            </div>
                            <div className="text-gray-300 group-hover:text-indigo-500 transition"><MessageCircle size={20}/></div>
                        </button>
                    ))
                )}
            </div>
        </div>
      );
  }

  // --- VIEW 2: CHAT ROOM (If chat selected) ---
  return (
    <div className="flex flex-col h-[75vh] bg-[#F9FAFB] rounded-[32px] shadow-lg border border-white overflow-hidden relative">
      {/* Chat Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => setCurrentChat(null)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"><ChevronLeft size={24}/></button>
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{currentChat.name.charAt(0)}</div>
        <div><h2 className="font-bold text-gray-800">{currentChat.name}</h2><p className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0">
        {messages.map(msg => {
          const isMe = msg.uid === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-5 py-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                 {msg.text}
                 <span className={`text-[10px] block mt-1 opacity-70 text-right ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                    {msg.createdAt ? "Just now" : "Sending..."}
                 </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef}></div>
      </div>

      {/* Input */}
      <form onSubmit={sendMsg} className="p-3 bg-white border-t border-gray-100 flex gap-2 z-10">
        <input className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 outline-none focus:ring-2 ring-indigo-400 font-medium" placeholder="Type message..." value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" className={`p-3 rounded-full transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`} disabled={!input.trim()}><Send size={20}/></button>
      </form>
    </div>
  );
};

const ProfilePage = ({ user, requests, userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(userProfile);
  const myCount = requests ? requests.filter(r => r.requesterId === user.uid).length : 0;
  const refreshAvatar = () => { const seed = Math.random().toString(36).substring(7); setEditData({ ...editData, photoURL: `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=c0aede,b6e3f4` }); };
  const handleSave = async () => { setLoading(true); try { await setDoc(doc(db, "users", user.uid), editData, { merge: true }); setUserProfile(editData); setIsEditing(false); } catch (e) { alert("Error saving: " + e.message); } setLoading(false); };
  return (
    <div className="flex flex-col items-center pt-6 pb-20">
      <div className="w-full bg-white rounded-[40px] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
        <div className="relative flex flex-col items-center">
           <div className="relative group">
              <img src={isEditing ? editData.photoURL : userProfile.photoURL} className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl bg-white" alt="Profile" />
              {isEditing && <button onClick={refreshAvatar} className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition shadow-md"><RefreshCw size={20} /></button>}
           </div>
           {isEditing ? <input className="mt-4 text-2xl font-extrabold text-center bg-transparent border-b-2 border-indigo-200 outline-none" value={editData.customName} onChange={e=>setEditData({...editData, customName:e.target.value})} /> : <h2 className="text-3xl font-extrabold text-gray-900 mt-4">{userProfile.customName}</h2>}
           <div className="w-full mt-8 space-y-4 text-left">
              <ProfileField label="Bio" isEditing={isEditing} value={isEditing?editData.bio:userProfile.bio} onChange={v=>setEditData({...editData, bio:v})} />
              <div className="grid grid-cols-2 gap-4">
                  <ProfileField label="Major" isEditing={isEditing} value={isEditing?editData.major:userProfile.major} onChange={v=>setEditData({...editData, major:v})} />
                  <ProfileField label="Year" isEditing={isEditing} value={isEditing?editData.year:userProfile.year} onChange={v=>setEditData({...editData, year:v})} />
              </div>
           </div>
           <div className="mt-6 w-full flex gap-3">
             {isEditing ? (
                <>
                <button onClick={() => {setIsEditing(false); setEditData(userProfile)}} disabled={loading} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2"><X size={18}/> Cancel</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg">{loading ? "Saving..." : <><Save size={18}/> Save</>}</button>
                </>
             ) : <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-100 transition"><Edit2 size={18}/> Edit Profile</button>}
           </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mt-6">
        <div className="bg-white p-4 rounded-3xl shadow-sm text-center border border-gray-100"><h3 className="text-2xl font-bold">{myCount}</h3><p className="text-[10px] font-bold text-gray-400 uppercase">Plans</p></div>
        <div className="bg-white p-4 rounded-3xl shadow-sm text-center border border-gray-100"><h3 className="text-2xl font-bold">4.9</h3><p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p></div>
        <div className="bg-white p-4 rounded-3xl shadow-sm text-center border border-gray-100"><h3 className="text-2xl font-bold">12</h3><p className="text-[10px] font-bold text-gray-400 uppercase">Rides</p></div>
      </div>
      <button onClick={() => auth.signOut()} className="mt-8 w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 border-2 border-red-100 px-6 py-4 rounded-2xl hover:bg-red-100 transition"><LogOut size={22} /> Log Out</button>
    </div>
  );
};

const ProfileField = ({label, value, isEditing, onChange}) => (
  <div className={`bg-gray-50 p-3 rounded-2xl transition ${isEditing ? 'ring-2 ring-indigo-100 bg-white' : ''}`}>
    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
    {isEditing ? <input className="w-full bg-transparent font-bold outline-none text-gray-900" value={value} onChange={e=>onChange(e.target.value)}/> : <p className="font-bold text-gray-800">{value}</p>}
  </div>
);

const HomeFeed = ({ user, requests, filter, setFilter, searchText, setSearchText, handleDelete, handleEdit, handleSOS, openNewRequest, handleJoin, handleConnect }) => {
  const filtered = requests.filter(req => {
    const matchesFilter = filter === 'ALL' || req.type === filter || (filter === 'ALL' && req.type === 'SOS');
    const matchesSearch = (req.title?.toLowerCase() || "").includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search size={22} className="text-gray-400" />
        <input type="text" placeholder="Search campus..." className="w-full outline-none text-gray-600 bg-transparent" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </div>
      <div className="h-60 w-full bg-white rounded-[32px] overflow-hidden shadow-sm p-1.5 relative z-0">
        <div className="h-full w-full rounded-[26px] overflow-hidden relative z-0"><MapComponent requests={requests} /></div>
        <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 z-10"><div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div><span className="text-xs font-bold text-indigo-900">Live Campus</span></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={openNewRequest} className="p-6 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-xl hover:scale-[1.02] transition text-left"><Car size={28} className="mb-4" /><h3 className="font-bold text-xl">Pool & Travel</h3></button>
        <button onClick={handleSOS} className="p-6 rounded-[32px] bg-white border-2 border-red-100 text-red-500 shadow-xl hover:scale-[1.02] transition text-left"><AlertTriangle size={28} className="mb-4" /><h3 className="font-bold text-xl">SOS</h3></button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-gray-900">Campus Feed</h2>
          <div className="flex gap-1 bg-gray-200/50 p-1.5 rounded-2xl">{['ALL', 'RIDE', 'ERRAND'].map(t => (<button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filter === t ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'ERRAND' ? 'DELIVERY' : t}</button>))}</div>
        </div>
        <div className="space-y-3">
          {filtered.length === 0 && <div className="text-center p-8 text-gray-400 font-medium">No plans found.</div>}
          {filtered.map(req => <RequestCard key={req.id} req={req} user={user} handleDelete={handleDelete} handleEdit={handleEdit} handleJoin={handleJoin} handleConnect={handleConnect} />)}
        </div>
      </div>
    </div>
  );
};

const ActivityPage = ({ user, requests, handleDelete, handleEdit }) => {
  const myRequests = requests.filter(r => r.requesterId === user.uid);
  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold mb-4 text-indigo-900">Your History</h2>
      {myRequests.length === 0 ? <div className="bg-white p-10 rounded-3xl text-center text-gray-400">No activity yet.</div> : myRequests.map(req => <RequestCard key={req.id} req={req} user={user} handleDelete={handleDelete} handleEdit={handleEdit} />)}
    </div>
  );
};

const RequestCard = ({ req, user, handleDelete, handleEdit, handleJoin, handleConnect }) => {
  const isMe = req.requesterId === user.uid;
  const isJoined = req.participants?.includes(user.uid);
  
  return (
    <div className={`bg-white p-5 rounded-[24px] shadow-sm border flex items-center gap-5 transition-all ${req.type === 'SOS' ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:border-indigo-100 hover:shadow-md'}`}>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${req.type === 'RIDE' ? 'bg-indigo-100 text-indigo-600' : (req.type === 'SOS' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-500')}`}>
        {req.type === 'RIDE' ? <Car size={26} /> : (req.type === 'SOS' ? <AlertTriangle size={26} /> : <Utensils size={26} />)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-extrabold text-sm ${req.type === 'SOS' ? 'text-red-600' : 'text-gray-900'}`}>{req.title}</h4>
        <p className="text-xs text-gray-500 mt-1 truncate font-medium">{req.description}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400">
          <span className="text-indigo-400">{req.requesterName?.split(' ')[0]}</span> • {req.time || "Now"}
          {req.subType === 'OFFER' && <span className="text-green-600 bg-green-50 px-1.5 rounded">OFFERING</span>}
          {req.participants?.length > 0 && <span className="text-gray-500 bg-gray-100 px-1.5 rounded flex items-center gap-1"><User size={8}/> {req.participants.length}</span>}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pl-2 border-l border-gray-100 items-center">
        {isMe ? (
          <>
            <button onClick={() => handleEdit(req)} className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"><Edit2 size={16} /></button>
            <button onClick={() => handleDelete(req.id)} className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><Trash2 size={16} /></button>
          </>
        ) : (req.subType === 'OFFER' || req.type === 'ERRAND') && (
          <div className="flex flex-col gap-2">
            <button onClick={() => handleJoin(req)} className={`h-9 px-3 rounded-xl flex items-center justify-center transition font-bold text-xs gap-1 ${isJoined ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white'}`}>
                {isJoined ? <Check size={16}/> : (req.type === 'RIDE' ? "Book" : "Accept")}
            </button>
            {isJoined && (
               <button onClick={() => handleConnect(req)} className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition">
                  <MessageCircle size={16} />
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const NavBtn = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>{icon}</button>
);

export default Dashboard;