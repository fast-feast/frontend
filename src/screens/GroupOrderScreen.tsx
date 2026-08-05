import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Plus, Lock, Crown, X, AlertTriangle, Search, UserPlus } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { groupParticipants } from '@/data/mockData';
import { getCanteenById } from '@/services/canteens';

export default function GroupOrderScreen() {
  const { navigate, showToast, state, dispatch, removeFromCart } = useApp();
  const [hasGroup, setHasGroup] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<typeof groupParticipants[0] | null>(null);
  const firstName = state.user.name.split(' ')[0] || 'You';
  const inviteSlug = firstName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'fast-feast';
  const [participants, setParticipants] = useState(
    groupParticipants.map((participant) =>
      participant.isHost
        ? { ...participant, name: firstName, avatar: firstName[0]?.toUpperCase() || 'Y' }
        : participant
    )
  );
  const [mockSharedItems, setMockSharedItems] = useState([
    { id: 'gi1', name: 'Cheese Burger', qty: 2, price: 120, addedBy: firstName, avatar: firstName[0]?.toUpperCase() || 'Y', color: 'from-orange-500 to-red-500' },
    { id: 'gi2', name: 'Fries', qty: 1, price: 60, addedBy: 'Aisha', avatar: 'A', color: 'from-pink-500 to-rose-500' },
    { id: 'gi3', name: 'Cold Coffee', qty: 2, price: 80, addedBy: 'Rohan', avatar: 'R', color: 'from-blue-500 to-cyan-500' },
    { id: 'gi4', name: 'Chocolate Brownie', qty: 1, price: 90, addedBy: 'Priya', avatar: 'P', color: 'from-purple-500 to-violet-500' },
  ]);
  const [liveActivity] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [activeGroups] = useState([
    { id: 'g1', host: 'Aisha', canteen: 'Main Canteen', members: 3, code: 'aisha-group-23' },
    { id: 'g2', host: 'Rohan', canteen: 'Cafe Brew', members: 2, code: 'rohan-coffee-17' },
    { id: 'g3', host: 'Priya', canteen: 'South Square', members: 4, code: 'priya-south-08' },
  ]);

  // The group pays for the user's cart, so the header must show the REAL canteen of that cart.
  const groupCanteenId = state.cart.length > 0 ? state.cart[0].canteenId : null;
  const [groupCanteenName, setGroupCanteenName] = useState('');
  useEffect(() => {
    if (!groupCanteenId) return;
    let cancelled = false;
    getCanteenById(groupCanteenId)
      .then((res) => { if (!cancelled) setGroupCanteenName(res.data.name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [groupCanteenId]);

  // Personalized friend suggestions based on user profile and order history
  const { frequentPartners, popularOnCampus } = useMemo(() => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-violet-500',
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-indigo-500 to-purple-500',
      'from-red-500 to-pink-500',
      'from-teal-500 to-green-500',
    ];

    // Frequent order partners (from mock order history)
    const frequentPartners = [
      { id: 'f1', name: 'Aisha', color: colors[0], mutualOrders: 6, lastOrdered: '2 days ago' },
      { id: 'f2', name: 'Rohan', color: colors[1], mutualOrders: 4, lastOrdered: '5 days ago' },
      { id: 'f3', name: 'Priya', color: colors[2], mutualOrders: 3, lastOrdered: '1 week ago' },
    ];

    // Popular on campus (suggested based on canteen popularity)
    const popularOnCampus = [
      { id: 'f4', name: 'Vikram', color: colors[3], mutualOrders: 1, lastOrdered: 'New' },
      { id: 'f5', name: 'Neha', color: colors[4], mutualOrders: 0, lastOrdered: 'New' },
      { id: 'f6', name: 'Arjun', color: colors[5], mutualOrders: 0, lastOrdered: 'New' },
      { id: 'f7', name: 'Kavya', color: colors[6], mutualOrders: 0, lastOrdered: 'New' },
    ];

    return { frequentPartners, popularOnCampus };
  }, []);

  // Merge global cart items (added via canteenDetail) into shared items
  const cartItems = state.cart.map((item) => ({
    id: `cart-${item.id}`,
    name: item.name,
    qty: item.quantity,
    price: item.price,
    addedBy: firstName,
    avatar: firstName[0]?.toUpperCase() || 'Y',
    color: 'from-orange-500 to-red-500',
  }));

  // Exclude mock items added by the current user (they'll be replaced by actual cart items)
  const mockItemsWithoutYou = mockSharedItems.filter((i) => i.addedBy !== firstName);

  // Combine: cart items first, then other members' mock items
  const allItems = cartItems.length > 0 ? [...cartItems, ...mockItemsWithoutYou] : mockSharedItems;

  const total = allItems.reduce((s, i) => s + i.price * i.qty, 0);

  const handleCopyLink = () => {
    setCopied(true);
    showToast('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetGroupState = () => {
    setIsLocked(false);
    setParticipants(
      groupParticipants.map((participant) =>
        participant.isHost
          ? { ...participant, name: firstName, avatar: firstName[0]?.toUpperCase() || 'Y' }
          : participant
      )
    );
    setMockSharedItems([
      { id: 'gi1', name: 'Cheese Burger', qty: 2, price: 120, addedBy: firstName, avatar: firstName[0]?.toUpperCase() || 'Y', color: 'from-orange-500 to-red-500' },
      { id: 'gi2', name: 'Fries', qty: 1, price: 60, addedBy: 'Aisha', avatar: 'A', color: 'from-pink-500 to-rose-500' },
      { id: 'gi3', name: 'Cold Coffee', qty: 2, price: 80, addedBy: 'Rohan', avatar: 'R', color: 'from-blue-500 to-cyan-500' },
      { id: 'gi4', name: 'Chocolate Brownie', qty: 1, price: 90, addedBy: 'Priya', avatar: 'P', color: 'from-purple-500 to-violet-500' },
    ]);
  };

  const handleLockOrder = () => {
    setIsLocked(true);
    // Build member data for payment breakdown
    const members = participants.map((member) => {
      const memberItems = allItems.filter((i) => i.addedBy === member.name);
      return {
        name: member.name === firstName ? 'You' : member.name,
        avatar: member.avatar,
        color: member.color,
        itemCount: memberItems.length,
        subtotal: memberItems.reduce((s, i) => s + i.price * i.qty, 0),
      };
    });
    dispatch({ type: 'SET_GROUP_DATA', total, members });
    showToast('Order locked! Proceeding to payment...');
    setTimeout(() => navigate('payment', 'push'), 1000);
  };

  if (!hasGroup) {
    return (
      <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-28 h-28 rounded-full purple-gradient/20 flex items-center justify-center"
          >
            <Users size={44} className="text-[#8B5CF6]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mt-5 text-center">Order with Friends!</h2>
          <p className="text-sm text-[#A0A0A0] text-center mt-2 leading-relaxed max-w-sm">
            Create your own group or join an existing one to order together.
          </p>

          {/* Create Group */}
          <div className="w-full max-w-sm mt-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setHasGroup(true)}
              className="w-full h-14 rounded-full food-gradient text-white font-semibold shadow-glow-orange flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Start Group Order
            </motion.button>
          </div>

          {/* Divider */}
          <div className="w-full max-w-sm flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-white/[0.08]" />
            <span className="text-[11px] text-[#6B6B6B] font-medium">OR</span>
            <div className="flex-1 h-[1px] bg-white/[0.08]" />
          </div>

          {/* Join with Invite Code */}
          <div className="w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-2">Join with Invite Code</h3>
            <div className="flex gap-2">
              <div className="flex-1 h-12 rounded-xl bg-card-elevated border border-white/[0.06] flex items-center px-3">
                <input
                  type="text"
                  placeholder="Enter invite code..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B6B6B] outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!inviteCode.trim()) return;
                  resetGroupState();
                  setHasGroup(true);
                  showToast(`Joined group: ${inviteCode}`);
                  setInviteCode('');
                }}
                disabled={!inviteCode.trim()}
                className="h-12 px-5 rounded-xl food-gradient text-white text-sm font-medium disabled:opacity-40"
              >
                Join
              </motion.button>
            </div>
          </div>

          {/* Active Groups */}
          <div className="w-full max-w-sm mt-6 pb-8">
            <h3 className="text-sm font-semibold text-white mb-3">Active Groups</h3>
            <div className="space-y-2">
              {activeGroups.map((g, i) => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    resetGroupState();
                    setHasGroup(true);
                    showToast(`Joined ${g.host}'s group at ${g.canteen}`);
                  }}
                  className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {g.host[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{g.host}'s Group</p>
                    <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                      {g.canteen} • {g.members} members
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-medium">
                      Live
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-surface h-full flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="pt-4 px-4 md:px-6 lg:px-8 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Group Order</h1>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Live</span>
          </div>
        </div>
        <p className="text-xs text-[#A0A0A0] mt-0.5">{groupCanteenName ? `${groupCanteenName} • ` : ''}{participants.length} people ordering</p>
      </div>

      {/* Invite Link */}
      <div className="mx-4 md:mx-6 lg:mx-8 bg-card rounded-2xl p-3 flex items-center gap-2">
        <div className="flex-1 bg-card-elevated rounded-xl px-3 py-2">
          <p className="text-[10px] text-[#6B6B6B] truncate">fastfeast.app/g/{inviteSlug}-group-42</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleCopyLink}
          className="px-3 py-2 rounded-xl food-gradient text-white text-xs font-medium flex items-center gap-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>

      {/* Participant Avatars */}
      <div className="px-4 md:px-6 lg:px-8 mt-4">
        <div className="flex items-center">
          {participants.map((p, i) => {
            const isHost = p.isHost;
            return (
              <motion.div
                key={p.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xs font-bold border-2 border-[#0F0F0F] ${i > 0 ? '-ml-2' : ''} relative group`}
              >
                {p.avatar}
                {isHost && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-page flex items-center justify-center">
                    <Crown size={8} className="text-yellow-400" />
                  </div>
                )}
                {/* Remove button - only on non-host members, visible on hover */}
                {!isHost && participants.some(m => m.isHost) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoveTarget(p);
                    }}
                  >
                    <X size={8} className="text-white" />
                  </motion.button>
                )}
              </motion.div>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowAddFriend(true)}
            className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center -ml-2 hover:border-[#D94A5A]/50 transition-colors"
          >
            <Plus size={16} className="text-[#6B6B6B]" />
          </motion.button>
        </div>
      </div>

      {/* Live Activity Toast */}
      <AnimatePresence>
        {liveActivity && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3 bg-card-elevated rounded-xl px-3 py-2 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-xs text-[#A0A0A0]">{liveActivity}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Cart - Grouped by Member */}
      <div className="px-4 md:px-6 lg:px-8 mt-4 flex-1">
        <h3 className="text-sm font-semibold text-white mb-3">Shared Cart</h3>
        <div className="space-y-4">
          {participants.map((member) => {
            const memberItems = allItems.filter((i) => i.addedBy === member.name);
            const isYou = member.name === firstName;
            const isHostUser = participants.some((m) => m.isHost);
            return (
              <div key={member.id}>
                {/* Member header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                      {member.avatar}
                    </div>
                    <span className="text-xs font-medium text-white">
                      {isYou ? 'You' : member.name}
                    </span>
                    {member.isHost && (
                      <Crown size={10} className="text-yellow-400" />
                    )}
                    <span className="text-[10px] text-[#6B6B6B]">
                      {memberItems.length} item{memberItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Add Items button for each member */}
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => navigate('canteenDetail', 'push')}
                      disabled={isLocked}
                      className="w-7 h-7 rounded-full bg-card-elevated flex items-center justify-center disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                      <Plus size={13} className="text-[#A0A0A0]" />
                    </motion.button>
                    {/* Remove friend button - on non-host members */}
                    {!member.isHost && isHostUser && (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setRemoveTarget(member)}
                        className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <X size={12} className="text-red-400" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Member's items */}
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {memberItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-card rounded-xl p-3 flex items-center gap-3 pl-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-[#6B6B6B] mt-0.5">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-[#6B6B6B]">x{item.qty}</p>
                            <p className="text-sm font-bold text-[#FF6B35]">₹{item.price * item.qty}</p>
                          </div>
                          {/* Remove item button - shown for current user's items or host */}
                          {(isYou || isHostUser) && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (item.id.startsWith('cart-')) {
                                // Remove from global cart instead
                                removeFromCart(item.id.replace('cart-', ''));
                              } else {
                                setMockSharedItems((prev) => prev.filter((i) => i.id !== item.id));
                              }
                                showToast(`${item.name} removed`);
                              }}
                              className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                            >
                              <X size={10} className="text-[#6B6B6B] hover:text-red-400" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Empty state for this member */}
                  {memberItems.length === 0 && (
                    <div className="bg-card/50 rounded-xl py-4 flex items-center justify-center gap-2">
                      <span className="text-[11px] text-[#6B6B6B]">No items added yet</span>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => navigate('canteenDetail', 'push')}
                        disabled={isLocked}
                        className="text-[10px] px-3 py-1 rounded-full food-gradient text-white font-medium disabled:opacity-40"
                      >
                        + Add
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-5 pt-3 border-t border-white/[0.06] flex justify-between items-center">
          <span className="text-sm text-[#A0A0A0]">Total ({allItems.reduce((s, i) => s + i.qty, 0)} item{allItems.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''})</span>
          <span className="text-xl font-bold text-[#FF6B35]">₹{total}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 md:px-6 lg:px-8 pb-8 pt-4 space-y-2 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLockOrder}
          disabled={isLocked || allItems.length === 0}
          className="w-full h-14 rounded-full food-gradient text-white font-semibold shadow-glow-orange disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Lock size={18} />
          Lock Order & Pay ₹{total}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLeaveConfirm(true)}
          className="w-full h-10 text-sm font-medium text-red-400/70 hover:text-red-400 transition-colors"
        >
          Leave Group
        </motion.button>
      </div>

      {/* Add Friend Dialog */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-card rounded-2xl p-5 max-w-sm w-full border border-white/[0.06] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Add Friend</h3>
                <button onClick={() => { setShowAddFriend(false); setFriendSearch(''); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B6B6B] hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="h-11 rounded-xl bg-card-elevated border border-white/[0.06] flex items-center px-3 gap-2 mb-4">
                <Search size={16} className="text-[#6B6B6B]" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B6B6B] outline-none"
                />
              </div>

              {/* Friend list */}
              <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                {/* Frequent partners section */}
                {frequentPartners.filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase())).length > 0 && !friendSearch && (
                  <p className="text-[10px] text-[#6B6B6B] font-medium uppercase tracking-wider px-1 pt-1 pb-1">
                    Recently Ordered With
                  </p>
                )}
                {frequentPartners
                  .filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase()))
                  .map((friend) => {
                    const alreadyInGroup = participants.some((p) => p.name === friend.name);
                    return (
                      <motion.button
                        key={friend.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        disabled={alreadyInGroup}
                        onClick={() => {
                          const newId = `p${Date.now()}`;
                          setParticipants((prev) => [
                            ...prev,
                            {
                              id: newId,
                              name: friend.name,
                              avatar: friend.name[0],
                              color: friend.color,
                              isHost: false,
                            },
                          ]);
                          setShowAddFriend(false);
                          setFriendSearch('');
                          showToast(`${friend.name} added to the group!`);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-elevated transition-colors disabled:opacity-40"
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${friend.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {friend.name[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white">{friend.name}</p>
                          <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                            Last ordered {friend.lastOrdered}
                          </p>
                        </div>
                        {alreadyInGroup ? (
                          <span className="text-[10px] text-[#6B6B6B]">Already added</span>
                        ) : (
                          <div className="w-8 h-8 rounded-full food-gradient flex items-center justify-center">
                            <UserPlus size={14} className="text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}

                {/* Popular on campus section */}
                {popularOnCampus.filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase())).length > 0 && !friendSearch && (
                  <p className="text-[10px] text-[#6B6B6B] font-medium uppercase tracking-wider px-1 pt-3 pb-1">
                    Suggestions
                  </p>
                )}
                {popularOnCampus
                  .filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase()))
                  .map((friend) => {
                    const alreadyInGroup = participants.some((p) => p.name === friend.name);
                    return (
                      <motion.button
                        key={friend.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        disabled={alreadyInGroup}
                        onClick={() => {
                          const newId = `p${Date.now()}`;
                          setParticipants((prev) => [
                            ...prev,
                            {
                              id: newId,
                              name: friend.name,
                              avatar: friend.name[0],
                              color: friend.color,
                              isHost: false,
                            },
                          ]);
                          setShowAddFriend(false);
                          setFriendSearch('');
                          showToast(`${friend.name} added to the group!`);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-card-elevated transition-colors disabled:opacity-40"
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${friend.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {friend.name[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white">{friend.name}</p>
                          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Popular on campus</p>
                        </div>
                        {alreadyInGroup ? (
                          <span className="text-[10px] text-[#6B6B6B]">Already added</span>
                        ) : (
                          <div className="w-8 h-8 rounded-full food-gradient flex items-center justify-center">
                            <UserPlus size={14} className="text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}

                {/* Empty state */}
                {frequentPartners.filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase())).length === 0 &&
                  popularOnCampus.filter((f) => f.name.toLowerCase().includes(friendSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-[#6B6B6B] text-center py-6">No friends found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Dialog */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl p-6 max-w-sm w-full border border-white/[0.06] shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white text-center mt-3">Remove {removeTarget.name}?</h3>
              <p className="text-sm text-[#A0A0A0] text-center mt-2 leading-relaxed">
                They will be removed from the group and their items will be cleared.
              </p>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRemoveTarget(null)}
                  className="flex-1 h-11 rounded-xl bg-card-elevated text-white text-sm font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setParticipants((prev) => prev.filter((m) => m.id !== removeTarget.id));
                    setMockSharedItems((prev) => prev.filter((i) => i.addedBy !== removeTarget.name));
                    setRemoveTarget(null);
                    showToast(`${removeTarget.name} was removed from the group`);
                  }}
                  className="flex-1 h-11 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20"
                >
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Confirmation Dialog */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl p-6 max-w-sm w-full border border-white/[0.06] shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white text-center">Leave Group?</h3>
              <p className="text-sm text-[#A0A0A0] text-center mt-2 leading-relaxed">
                Are you sure you want to leave this group order? Your items will be removed.
              </p>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 h-11 rounded-xl bg-card-elevated text-white text-sm font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    setHasGroup(false);
                    showToast('You left the group');
                  }}
                  className="flex-1 h-11 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20"
                >
                  Leave
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
