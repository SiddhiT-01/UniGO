// src/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import RideModal from './RideModal';
import { UniGoLogo } from './UniGoLogo'; 
import { auth, db } from './firebase';
import { collection, query, orderBy, onSnapshot, limit, addDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { LogOut, Bell, Zap, MessageSquare, Home, Plus, Car, AlertTriangle, Search, Trash2, Edit2, User, MapPin, Clock, Check, MessageCircle, ChevronLeft, Utensils, Footprints, CheckCircle, Package, X, Send, RefreshCw, ShoppingBag, ArrowRight, Save, MoreVertical, Phone } from 'lucide-react';

const Dashboard = ({ user }) => {
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState('HOME');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('DEFAULT'); 
  const [requestToEdit, setRequestToEdit] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [searchText, setSearchText] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentChat, setCurrentChat] = useState(null); 
  const [liveAlert, setLiveAlert] = useState(null); // State for Pop-up Notification

  // Safe Profile Initialization
  const [userProfile, setUserProfile] = useState({
    customName: user?.displayName || "Student",
    photoURL: user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    bio: "Student at Uni",
    gender: "Prefer not to say", 
    major: "Undeclared",
    year: "1st Year"
  });

  // --- DATA FETCHING ---
  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(60));
    const unsubscribe = onSnapshot(q, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, []);

  // --- LIVE NOTIFICATION LOGIC ---
  // This watches for status changes to "IN_PROGRESS" and alerts participants
  useEffect(() => {
    if (requests.length === 0) return;
    
    requests.forEach(req => {
        // If I am a participant (but not the owner) AND status became IN_PROGRESS
        if (req.participants?.includes(user.uid) && req.requesterId !== user.uid && req.status === 'IN_PROGRESS') {
            let actionText = "started the trip";
            if (req.type === 'FOOD') actionText = "placed the order";
            if (req.type === 'ITEM') actionText = "exchanged the item";
            if (req.type === 'ERRAND') actionText = "started the errand";
            if (req.type === 'WALK') actionText = "started the walk";

            setLiveAlert({
                title: `${req.requesterName} ${actionText}!`,
                subtitle: "Check the chat for live updates.",
                id: req.id,
                icon: req.type === 'FOOD' ? <Utensils size={20}/> : (req.type === 'ITEM' ? <Package size={20}/> : <Footprints size={20}/>)
            });
            // Auto-hide alert after 6 seconds
            setTimeout(() => setLiveAlert(null), 6000);
        }
    });

    // Smart Matching Simulation
    const latest = requests[0];
    if (latest && latest.type === 'RIDE' && latest.requesterId !== user.uid && !liveAlert) {
        if (Math.random() > 0.95) { 
             setLiveAlert({
                title: "✨ Smart Match Found!",
                subtitle: `A ride to ${latest.destination} fits your schedule.`,
                icon: <Zap size={20}/>
             });
             setTimeout(() => setLiveAlert(null), 5000);
        }
    }
  }, [requests]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserProfile(prev => ({ ...prev, ...docSnap.data() }));
      } catch (e) { console.error("Profile Error:", e); }
    };
    fetchProfile();
  }, [user]);

  // --- ACTIONS ---
  const handleDelete = async (id) => { if (window.confirm("Delete this?")) await deleteDoc(doc(db, "requests", id)); };
  
  const handleResolveSOS = async (req) => {
    if (window.confirm("Mark as RESOLVED? This notifies admins you are safe.")) {
      await updateDoc(doc(db, "requests", req.id), { status: "RESOLVED", isPriority: false });
    }
  };

  const handleEdit = (req) => { setRequestToEdit(req); setShowModal(true); setModalMode('DEFAULT'); };
  
  // Custom Openers
  const openNewRequest = () => { setRequestToEdit(null); setShowModal(true); setModalMode('DEFAULT'); };
  const openErrandRequest = () => { setRequestToEdit(null); setShowModal(true); setModalMode('ERRAND'); };
  const openFoodRequest = () => { setRequestToEdit(null); setShowModal(true); setModalMode('FOOD'); }; 
  const openItemRequest = () => { setRequestToEdit(null); setShowModal(true); setModalMode('ITEM'); }; 
  const startSafeWalk = () => { setRequestToEdit(null); setShowModal(true); setModalMode('WALK'); }; 

  // Owner starts the activity -> Triggers notification for others
  const handleStart = async (req) => {
      let actionName = "Start";
      if (req.type === 'FOOD') actionName = "Order Placed";
      if (req.type === 'ITEM') actionName = "Item Exchanged";
      
      if (window.confirm(`Mark as ${actionName}? Participants will be notified.`)) {
          await updateDoc(doc(db, "requests", req.id), { status: "IN_PROGRESS" });
      }
  };

  const handleJoin = async (req) => {
    const isJoined = req.participants?.includes(user.uid);
    const reqRef = doc(db, "requests", req.id);
    const actionText = isJoined ? "Leave" : (req.type === 'WALK' ? "Join Walk" : (req.type === 'ERRAND' ? "Accept Task" : (req.type === 'FOOD' ? "Join Order" : "Book Seat")));

    try {
      if (isJoined) {
        if (!window.confirm(`Cancel: ${actionText}?`)) return;
        await updateDoc(reqRef, { participants: arrayRemove(user.uid) });
      } else {
        if (!window.confirm(`Confirm: ${actionText}?`)) return;
        await updateDoc(reqRef, { participants: arrayUnion(user.uid) });
        handleConnect(req); 
      }
    } catch (e) { alert(e.message); }
  };

  const handleConnect = (req) => {
    if (req.requesterId === user.uid) { alert("You created this request!"); return; }
    const chatId = [user.uid, req.requesterId].sort().join("_");
    setCurrentChat({ id: chatId, name: req.requesterName, partnerId: req.requesterId });
    setActiveTab('CHAT');
  };

  const handleSOS = async () => {
    if (!window.confirm("🚨 TRIGGER SOS? This alerts everyone nearby.")) return;
    try {
      await addDoc(collection(db, "requests"), { 
        type: "SOS", status: "CRITICAL", requesterId: user.uid, 
        requesterName: userProfile.customName || "User", 
        requesterGender: userProfile.gender,
        title: "🚨 URGENT: SOS HELP!", description: "Emergency! High Priority.", 
        location: [19.0760 + (Math.random()-0.5)*0.005, 72.8777 + (Math.random()-0.5)*0.005], 
        isPriority: true, createdAt: serverTimestamp() 
      });
    } catch (e) { alert(e.message); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'CHAT': return <ChatPage user={user} userProfile={userProfile} currentChat={currentChat} setCurrentChat={setCurrentChat} requests={requests} />;
      case 'ACTIVITY': return <ActivityPage user={user} requests={requests} handleDelete={handleDelete} handleEdit={handleEdit} handleStart={handleStart} />;
      case 'PROFILE': return <ProfilePage user={user} requests={requests} userProfile={userProfile} setUserProfile={setUserProfile} />;
      default: return <HomeFeed user={user} requests={requests} filter={filter} setFilter={setFilter} searchText={searchText} setSearchText={setSearchText} handleDelete={handleDelete} handleEdit={handleEdit} handleSOS={handleSOS} openNewRequest={openNewRequest} openErrandRequest={openErrandRequest} openFoodRequest={openFoodRequest} openItemRequest={openItemRequest} startSafeWalk={startSafeWalk} handleJoin={handleJoin} handleConnect={handleConnect} handleResolveSOS={handleResolveSOS} handleStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28 relative selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      {/* HEADER */}
      <div className="sticky top-0 z-[1000] bg-white/70 backdrop-blur-xl border-b border-white/50 px-8 py-4 flex justify-between items-center shadow-sm">
        <div onClick={() => setActiveTab('HOME')} className="cursor-pointer hover:opacity-80 transition flex items-center gap-2">
            <UniGoLogo className="h-8 w-auto" />
        </div>

        {/* 🔥 LIVE ALERT POPUP */}
        {liveAlert && (
             <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1002] animate-in slide-in-from-top-4 fade-in duration-500 min-w-[320px] cursor-pointer" onClick={() => setActiveTab('CHAT')}>
                <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 ring-4 ring-indigo-500/20">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">{liveAlert.icon || <Footprints size={20}/>}</div>
                    <div className="flex-1">
                        <h4 className="font-bold text-xs">{liveAlert.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">{liveAlert.subtitle}</p>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); setLiveAlert(null);}} className="ml-2 text-slate-500 hover:text-white"><X size={16}/></button>
                </div>
             </div>
        )}

        <div className="flex items-center gap-4 relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-white border border-gray-100 rounded-full text-slate-600 hover:text-indigo-600 transition relative shadow-sm">
            <Bell size={20} />
            {requests.some(r => r.type === 'SOS' && r.status !== 'RESOLVED') && <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
          </button>
          <div onClick={() => setActiveTab('PROFILE')} className="flex items-center gap-3 cursor-pointer group">
             <img src={userProfile.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-md group-hover:scale-105 transition object-cover bg-white" alt="Profile" />
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-800 leading-none">{(userProfile.customName || "User").split(' ')[0]}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{userProfile.major || 'Student'}</p>
             </div>
          </div>
          
          {showNotifications && (
            <div className="absolute top-16 right-0 w-96 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-0 z-[1001] animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex justify-between items-center"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Recent Activity</p><button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button></div>
                <div className="max-h-80 overflow-y-auto">
                  {requests.filter(r => r.status !== 'RESOLVED').slice(0, 5).map(r => (
                    <div key={r.id} className={`px-6 py-4 border-b border-slate-50 flex gap-4 items-start hover:bg-slate-50 transition ${r.type === 'SOS' ? 'bg-red-50/20' : ''}`}>
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${r.type === 'SOS' ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                      <div className="flex-1"><p className="text-sm text-slate-700 leading-snug"><span className="font-bold text-slate-900">{r.requesterName?.split(' ')[0]}</span> {r.type === 'SOS' ? ' needs HELP!' : (r.type === 'RIDE' ? ' posted a ride.' : ' needs an item.')}</p><p className="text-[11px] text-slate-400 mt-1 font-medium">{r.time || "Just now"}</p></div>
                    </div>
                  ))}
                  {requests.filter(r => r.status !== 'RESOLVED').length === 0 && <div className="p-8 text-center text-xs text-slate-400">All caught up!</div>}
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 mt-8 max-w-[1600px] mx-auto relative z-10">{renderContent()}</div>

      {/* FLOATING BOTTOM NAV */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-6 py-3 z-[999] flex items-center gap-8">
        <NavBtn id="home-btn" icon={<Home size={24} />} active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
        <NavBtn icon={<Zap size={24} />} active={activeTab === 'ACTIVITY'} onClick={() => setActiveTab('ACTIVITY')} />
        <button onClick={openNewRequest} className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full text-white shadow-xl shadow-indigo-300 flex items-center justify-center transform hover:scale-110 active:scale-95 transition -mt-10 border-[6px] border-[#F8FAFC]"><Plus size={32} /></button>
        <NavBtn icon={<MessageSquare size={24} />} active={activeTab === 'CHAT'} onClick={() => setActiveTab('CHAT')} />
        <NavBtn icon={<User size={24} />} active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} onDoubleClick={() => navigate('/admin')} />
      </div>

      <RideModal isOpen={showModal} onClose={() => setShowModal(false)} user={user} requestToEdit={requestToEdit} userProfile={userProfile} mode={modalMode} />
    </div>
  );
};

// ================== PAGE COMPONENTS ==================

// --- 1. HOME FEED ---
const HomeFeed = ({ user, requests, filter, setFilter, searchText, setSearchText, handleDelete, handleEdit, handleSOS, openNewRequest, openErrandRequest, openFoodRequest, openItemRequest, startSafeWalk, handleJoin, handleConnect, handleResolveSOS, handleStart }) => {
  const filtered = requests.filter(req => {
    if (req.status === 'RESOLVED') return false;
    if (filter === 'WOMEN') return (req.requesterGender === 'Female' || req.requesterGender === 'Non-binary') && (req.title?.toLowerCase() || "").includes(searchText.toLowerCase());
    
    // 🔥 UPDATED FILTER LOGIC
    const matchesFilter = filter === 'ALL' || req.type === filter || (filter === 'ALL' && (req.type === 'SOS' || req.type === 'WALK' || req.type === 'FOOD' || req.type === 'ITEM'));
    const matchesSearch = (req.title?.toLowerCase() || "").includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="grid grid-cols-12 gap-8 pb-20">
      <div className="hidden lg:block col-span-2 space-y-6 sticky top-28 h-fit">
         <div className="space-y-2"><h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-2">Filter Feed</h3>
            <div className="flex flex-col gap-2">{['ALL', 'RIDE', 'FOOD', 'ITEM', 'WALK', 'SOS', 'WOMEN'].map(t => (<button key={t} onClick={() => setFilter(t)} className={`text-left px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${filter === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-white/80 border border-slate-100'}`}>{t === 'WOMEN' ? 'Women Only' : (t.charAt(0) + t.slice(1).toLowerCase())}{filter === t && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}</button>))}</div>
         </div>
      </div>
      <div className="col-span-12 lg:col-span-10 space-y-8">
         <div className="h-[400px] w-full bg-white rounded-[40px] overflow-hidden shadow-sm border border-white/50 relative group z-0">
            <div className="absolute inset-0 z-0"><MapComponent requests={requests} /></div>
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none"><div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/50"><h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Hi, {(user.displayName || "User").split(' ')[0]}.</h1><p className="text-slate-500 font-bold text-xs flex items-center gap-2 mt-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {requests.length} active users</p></div></div>
         </div>
         <div className="bg-white/80 backdrop-blur-2xl p-2 rounded-[24px] shadow-sm border border-white/50 flex items-center gap-4 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 shrink-0"><Search size={20} /></div>
              <input className="w-full bg-transparent border-none text-base font-semibold text-slate-700 placeholder:text-slate-400 outline-none h-full" placeholder="Search for rides to Bandra, coffee runs, or safe walks..." value={searchText} onChange={e => setSearchText(e.target.value)}/>
              <div className="hidden md:flex pr-4 text-xs font-bold text-slate-300 uppercase tracking-widest">{filtered.length} Results</div>
         </div>
         
         {/* 🔥 UPDATED GRID BUTTONS FOR NEW TYPES */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ActionCard title="Get a Ride" subtitle="Pool & Travel" icon={<Car size={24}/>} color="blue" onClick={openNewRequest} />
            <ActionCard title="Food Pool" subtitle="Zomato/Swiggy" icon={<Utensils size={24}/>} color="orange" onClick={openFoodRequest} />
            <ActionCard title="Items" subtitle="Borrow/Buy" icon={<Package size={24}/>} color="purple" onClick={openItemRequest} />
            <ActionCard title="Safe Walk" subtitle="Companion" icon={<Footprints size={24}/>} color="green" onClick={startSafeWalk} />
            <ActionCard title="SOS Alert" subtitle="Emergency" icon={<AlertTriangle size={24}/>} color="red" onClick={handleSOS} />
         </div>

         <div className="space-y-4">
            <div className="flex justify-between items-end px-2"><h3 className="text-xl font-extrabold text-slate-900">Live Feed</h3><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time</span></div>
            {filtered.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-[40px] border border-white/50"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm"><Search size={32} className="text-slate-300"/></div><p className="text-slate-400 font-medium">No active requests found.</p></div>}
            {filtered.map(req => <RequestCard key={req.id} req={req} user={user} handleDelete={handleDelete} handleEdit={handleEdit} handleJoin={handleJoin} handleConnect={handleConnect} handleResolveSOS={handleResolveSOS} handleStart={handleStart} />)}
         </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, subtitle, icon, color, onClick }) => {
    const colors = { blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600', purple: 'bg-purple-50 text-purple-600' };
    return (
        <div onClick={onClick} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] transition cursor-pointer group flex flex-col justify-between h-44 hover:translate-y-[-4px]">
            <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition shadow-sm`}>{icon}</div>
            <div><h3 className="font-extrabold text-lg text-slate-800 leading-tight">{title}</h3><p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wide">{subtitle}</p></div>
        </div>
    )
}

// --- HELPER COMPONENTS ---
const RequestCard = ({ req, user, handleDelete, handleEdit, handleJoin, handleConnect, handleResolveSOS, handleStart }) => {
  const isMe = req.requesterId === user.uid;
  const isJoined = req.participants?.includes(user.uid);
  const isResolved = req.status === 'RESOLVED';
  const isInProgress = req.status === 'IN_PROGRESS';
  
  // 🔥 DYNAMIC LABELS
  const getActionLabel = () => { 
      if (req.type === 'WALK') return isJoined ? "Leave Walk" : "Join Walk";
      if (req.type === 'ERRAND') return isJoined ? "Drop Task" : "Accept Task";
      if (req.type === 'FOOD') return isJoined ? "Leave Order" : "Join Order"; // Fix for Food
      if (req.type === 'ITEM') return isJoined ? "Cancel" : "Lend Item"; // Fix for Item
      if (req.subType === 'OFFER') return isJoined ? "Cancel Seat" : "Book Seat"; 
      return isJoined ? "Cancel Offer" : "Offer Ride"; 
  };

  const getStartLabel = () => {
      if (req.type === 'FOOD') return "Order Placed";
      if (req.type === 'ITEM') return "Mark Exchanged";
      if (req.type === 'WALK') return "Start Walk";
      return "Start Trip";
  };

  return (
    <div className={`bg-white p-6 rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border flex items-center gap-6 transition-all hover:translate-y-[-2px] group ${req.type === 'SOS' ? 'border-red-100 bg-red-50/10' : (isInProgress ? 'border-green-400 border-2 bg-green-50/30' : 'border-slate-100')} ${isResolved ? 'opacity-50 grayscale' : ''}`}>
      <div className={`h-16 w-16 rounded-[20px] flex items-center justify-center text-2xl shrink-0 shadow-sm ${req.type === 'RIDE' ? 'bg-indigo-50 text-indigo-600' : (req.type === 'SOS' ? 'bg-red-50 text-red-600 animate-pulse' : (req.type === 'FOOD' ? 'bg-orange-50 text-orange-500' : (req.type === 'ITEM' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600')) )}`}>
        {req.type === 'RIDE' ? <Car size={28} /> : (req.type === 'SOS' ? <AlertTriangle size={28} /> : (req.type === 'FOOD' ? <Utensils size={28}/> : (req.type === 'ITEM' ? <Package size={28}/> : <Footprints size={28}/> )))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5"><span className="text-[10px] font-extrabold tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase">{req.subType || req.type}</span>{isInProgress && <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-1 rounded-lg animate-pulse">LIVE NOW</span>}{req.time && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {req.time}</span>}</div>
        <h4 className={`font-bold text-lg ${req.type === 'SOS' ? 'text-red-600' : 'text-slate-800'}`}>{req.title}</h4>
        <p className="text-sm text-slate-500 mt-1 truncate font-medium">{req.description}</p>
        {req.participants?.length > 0 && <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full"><User size={12}/> {req.participants.length} Active</div>}
      </div>
      <div className="flex flex-col gap-2 pl-6 border-l border-slate-50 items-center justify-center min-w-[100px]">
        {isMe ? (
          <>
            {req.participants?.length > 0 && !isInProgress && !isResolved && (
                <button onClick={() => handleStart(req)} className="w-full h-10 px-4 rounded-xl bg-green-600 text-white text-xs font-bold shadow-lg shadow-green-200 hover:scale-105 transition flex items-center justify-center gap-1">{getStartLabel()}</button>
            )}
            {req.type === 'SOS' && !isResolved ? (<button onClick={() => handleResolveSOS(req)} className="p-3 rounded-2xl bg-green-100 text-green-700 hover:bg-green-200 transition" title="Mark Safe"><CheckCircle size={20}/></button>) : (<button onClick={() => handleEdit(req)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"><Edit2 size={20} /></button>)}<button onClick={() => handleDelete(req.id)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={20} /></button>
          </>
        ) : (!isResolved) && (
          <div className="flex flex-col gap-2"><button onClick={() => handleJoin(req)} className={`h-10 px-5 rounded-xl flex items-center justify-center transition font-bold text-xs gap-1.5 shadow-sm whitespace-nowrap ${isJoined ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'}`}>{isJoined ? <X size={14}/> : <Check size={14}/>} {getActionLabel()}</button>{isJoined && <button onClick={() => handleConnect(req)} className={`h-10 w-full rounded-xl flex items-center justify-center transition ${isInProgress ? 'bg-green-500 text-white shadow-green-200 shadow-lg animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}><MessageCircle size={20} /></button>}</div>
        )}
      </div>
    </div>
  );
};

// --- CHAT PAGE ---
const ChatPage = ({ user, userProfile, currentChat, setCurrentChat, requests }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  // 🔥 FIX: Safe requests array
  const activeContacts = (requests || []).filter(r => 
    (r.requesterId === user.uid && r.participants?.length > 0) || 
    (r.participants?.includes(user.uid))
  ).map(r => ({
    uid: r.requesterId === user.uid ? r.participants[0] : r.requesterId,
    name: r.requesterId === user.uid ? "Participant" : r.requesterName,
    reqTitle: r.title
  }));
  const uniqueContacts = [...new Map(activeContacts.map(item => [item.uid, item])).values()];

  useEffect(() => {
    if (!currentChat) return;
    const q = query(collection(db, "chats", currentChat.id, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [currentChat]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;
    const senderName = userProfile?.customName || user.displayName || "User";
    await addDoc(collection(db, "chats", currentChat.id, "messages"), {
      text: input, uid: user.uid, displayName: senderName, createdAt: serverTimestamp()
    });
    setInput('');
  };

  if (!currentChat) return <div className="flex flex-col h-[75vh] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white/50 overflow-hidden"><div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md"><h2 className="font-extrabold text-slate-800 text-xl">Messages</h2><span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">{uniqueContacts.length} Active</span></div><div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">{uniqueContacts.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-center p-8"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm"><MessageSquare size={28} className="text-slate-300"/></div><h3 className="font-bold text-slate-900 text-lg mb-2">No Chats Yet</h3><p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">Connect with others by booking rides.</p></div> : uniqueContacts.map(c => <button key={c.uid} onClick={() => setCurrentChat({ id: [user.uid, c.uid].sort().join("_"), name: c.name })} className="w-full text-left p-4 hover:bg-white hover:shadow-sm rounded-[24px] transition flex items-center gap-4 group border border-transparent hover:border-slate-100"><div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">{/* SAFE CHAR AT */ (c.name || "U").charAt(0)}</div><div className="flex-1"><h4 className="font-bold text-slate-800">{c.name}</h4><p className="text-xs text-slate-400 truncate w-48 mt-0.5">{c.reqTitle}</p></div></button>)}</div></div>;
  
  // 🔥 UPGRADED CHAT UI
  const bgPattern = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`;
  return (
    <div className="flex flex-col h-[75vh] bg-[#f8fafc] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative" style={{backgroundImage: bgPattern}}>
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center gap-3 shadow-sm z-10 sticky top-0">
        <button onClick={() => setCurrentChat(null)} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><ChevronLeft size={24}/></button>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">{(currentChat.name || "U").charAt(0)}</div>
        <div className="flex-1">
            <h2 className="font-bold text-slate-800 leading-none">{currentChat.name}</h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</p>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><Phone size={20}/></button>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><MoreVertical size={20}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0">
        {messages.map(msg => {
          const isMe = msg.uid === user.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 group`}>
                <div className={`px-5 py-3 max-w-[75%] text-sm shadow-sm transition-all relative ${isMe ? 'bg-indigo-600 text-white rounded-[20px] rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-[20px] rounded-bl-sm'}`}>
                    {msg.text}
                    <span className={`text-[9px] font-medium absolute -bottom-5 ${isMe ? 'right-1 text-slate-400' : 'left-1 text-slate-400'} opacity-0 group-hover:opacity-100 transition`}>Just now</span>
                </div>
            </div>
          );
        })}
        <div ref={scrollRef}></div>
      </div>
      
      <form onSubmit={sendMsg} className="p-4 bg-white border-t border-slate-100 flex gap-3 z-10 items-center">
        <button type="button" className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition"><Plus size={20}/></button>
        <div className="flex-1 bg-slate-50 border-0 rounded-full px-5 py-3 focus-within:ring-2 ring-indigo-100 transition flex items-center">
            <input className="w-full bg-transparent outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button type="submit" className={`p-3.5 rounded-full transition-all transform active:scale-95 ${input.trim() ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`} disabled={!input.trim()}><Send size={20} className={input.trim() ? '-rotate-45 ml-0.5 mb-0.5' : ''}/></button>
      </form>
    </div>
  );
};

// --- PROFILE PAGE ---
const ProfilePage = ({ user, requests, userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editData, setEditData] = useState({
      customName: userProfile?.customName || "",
      photoURL: userProfile?.photoURL || "",
      bio: userProfile?.bio || "",
      gender: userProfile?.gender || "Prefer not to say",
      major: userProfile?.major || "",
      year: userProfile?.year || ""
  });

  useEffect(() => {
      setEditData({
          customName: userProfile.customName || "",
          photoURL: userProfile.photoURL || "",
          bio: userProfile.bio || "",
          gender: userProfile.gender || "Prefer not to say",
          major: userProfile.major || "",
          year: userProfile.year || ""
      });
  }, [userProfile]);

  const myCount = requests ? requests.filter(r => r.requesterId === user.uid).length : 0;
  
  const refreshAvatar = () => { const seed = Math.random().toString(36).substring(7); setEditData({ ...editData, photoURL: `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=c0aede,b6e3f4` }); };
  const handleSave = async () => { 
      setLoading(true); 
      try { 
          await setDoc(doc(db, "users", user.uid), editData, { merge: true }); 
          setUserProfile(editData); 
          setIsEditing(false); 
      } catch (e) { alert(e.message); } 
      setLoading(false); 
  };

  if (!userProfile) return <div className="p-10 text-center font-bold text-slate-400">Loading Profile...</div>;

  return (
    <div className="flex flex-col items-center pt-8 pb-20 max-w-2xl mx-auto">
      <div className="w-full bg-white rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
        <div className="relative flex flex-col items-center">
           <div className="relative group">
              <img src={isEditing ? editData.photoURL : userProfile.photoURL} className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl bg-white object-cover" alt="Profile" />
              {isEditing && <button onClick={refreshAvatar} className="absolute bottom-0 right-0 p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition shadow-lg"><RefreshCw size={20} /></button>}
           </div>
           
           {isEditing ? <input className="mt-6 text-2xl font-extrabold text-center bg-transparent border-b-2 border-indigo-100 outline-none focus:border-indigo-500 transition text-slate-800" value={editData.customName || ""} onChange={e=>setEditData({...editData, customName:e.target.value})} /> : <h2 className="text-3xl font-extrabold text-slate-900 mt-6">{userProfile.customName}</h2>}
           
           <div className="w-full mt-8 space-y-4 text-left">
              <ProfileField label="Bio" isEditing={isEditing} value={isEditing ? editData.bio : userProfile.bio} onChange={v=>setEditData({...editData, bio:v})} />
              <div className={`bg-slate-50 p-4 rounded-2xl transition border ${isEditing ? 'border-indigo-200 bg-white' : 'border-transparent'}`}>
                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                 {isEditing ? (
                    <select className="w-full bg-transparent font-bold outline-none text-slate-800" value={editData.gender || "Prefer not to say"} onChange={e=>setEditData({...editData, gender:e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                 ) : <p className="font-bold text-slate-800">{userProfile.gender || "Not set"}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4"><ProfileField label="Major" isEditing={isEditing} value={isEditing ? editData.major : userProfile.major} onChange={v=>setEditData({...editData, major:v})} /><ProfileField label="Year" isEditing={isEditing} value={isEditing ? editData.year : userProfile.year} onChange={v=>setEditData({...editData, year:v})} /></div>
           </div>
           <div className="mt-8 w-full flex gap-3">
             {isEditing ? (
                <>
                <button onClick={() => {setIsEditing(false); setEditData(userProfile)}} disabled={loading} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition"><X size={18}/> Cancel</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">{loading ? "Saving..." : <><Save size={18}/> Save</>}</button>
                </>
             ) : <button onClick={() => setIsEditing(true)} className="w-full py-3.5 bg-indigo-50 text-indigo-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-100 transition"><Edit2 size={18}/> Edit Profile</button>}
           </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full mt-6"><StatsCard label="Requests" value={myCount} /><StatsCard label="Rating" value="4.9" /><StatsCard label="Impact" value="High" /></div>
      <button onClick={() => auth.signOut()} className="mt-8 w-full flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 border-2 border-red-50 px-6 py-4 rounded-2xl hover:bg-red-100 transition"><LogOut size={20} /> Log Out</button>
    </div>
  );
};

const ProfileField = ({label, value, isEditing, onChange}) => (<div className={`bg-slate-50 p-4 rounded-2xl transition border ${isEditing ? 'border-indigo-200 bg-white' : 'border-transparent'}`}><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{label}</p>{isEditing ? <input className="w-full bg-transparent font-bold outline-none text-slate-800" value={value || ""} onChange={e=>onChange(e.target.value)}/> : <p className="font-bold text-slate-800">{value || "Not set"}</p>}</div>);
const StatsCard = ({ label, value }) => (<div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 text-center"><h3 className="text-2xl font-extrabold text-slate-900">{value}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p></div>);

// --- ACTIVITY PAGE ---
const ActivityPage = ({ user, requests, handleDelete, handleEdit, handleStart }) => {
  const myRequests = requests.filter(r => r.requesterId === user.uid);
  return (
    <div className="pb-24 pt-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-extrabold mb-6 text-slate-900 px-2">Your History</h2>
      {myRequests.length === 0 ? <div className="bg-white p-12 rounded-[32px] text-center text-slate-400 border border-slate-100">No activity yet.</div> : <div className="space-y-4">{myRequests.map(req => <RequestCard key={req.id} req={req} user={user} handleDelete={handleDelete} handleEdit={handleEdit} handleStart={handleStart} />)}</div>}
    </div>
  );
};

const NavBtn = ({ icon, active, onClick, id, onDoubleClick }) => (
  <button id={id} onClick={onClick} onDoubleClick={onDoubleClick} className={`p-3.5 rounded-full transition-all ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{icon}</button>
);

export default Dashboard;