/**
 * ໂມດູນຈັດການຂໍ້ມູນຜູ້ໃຊ້ງານລະບົບ PARKO (User Management Page)
 * ສ່ວນຕິດຕໍ່ຜູ້ໃຊ້ງານສະເພາະລະດັບຜູ້ບໍລິຫານ (Admin) ເພື່ອຄົ້ນຫາ, ເພີ່ມ, ແກ້ໄຂ,
 * ປ່ຽນລະຫັດຜ່ານ, ກຳນົດສິດທິການນຳໃຊ້ (ADMIN/STAFF) ແລະ ລຶບບັນຊີຜູ້ໃຊ້ງານໃນລະບົບ.
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import usersIcon from '../../components/icons/users.svg?raw';
import userPlusIcon from '../../components/icons/user-plus.svg?raw';
import userIcon from '../../components/icons/user.svg?raw';
import pencilIcon from '../../components/icons/pencil.svg?raw';
import squarePenIcon from '../../components/icons/square-pen.svg?raw';
import trashIcon from '../../components/icons/trash-2.svg?raw';
import searchIcon from '../../components/icons/search.svg?raw';
import userSearchIcon from '../../components/icons/user-search.svg?raw';
import mailIcon from '../../components/icons/mail.svg?raw';
import lockIcon from '../../components/icons/lock.svg?raw';
import saveIcon from '../../components/icons/save.svg?raw';
import xIcon from '../../components/icons/x.svg?raw';

function SvgIcon({ raw, className = "w-5 h-5" }: { raw: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current ${className}`}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '', role: 'STAFF' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const load = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers((data.data || data).users || []);
    } catch { }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.patch(`/users/${editing.id}`, { displayName: form.displayName, email: form.email, role: form.role });
        if (form.password && form.password.trim().length > 0) {
          await api.post(`/users/${editing.id}/reset-password`, { newPassword: form.password });
        }
      } else {
        await api.post('/users', form);
      }
      toast.success(editing ? 'ອັບເດດສຳເລັດ' : 'ສ້າງສຳເລັດ');
      setShowForm(false);
      setEditing(null);
      setForm({ username: '', email: '', password: '', displayName: '', role: 'STAFF' });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const executeDelete = async (id: string) => {
    const tId = toast.loading('ກຳລັງດຳເນີນການ...');
    try {
      await api.delete(`/users/${id}`);
      toast.success('ລຶບສຳເລັດ', { id: tId });
      load();
    } catch {
      toast.error('Failed to delete', { id: tId });
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: '', displayName: u.displayName, role: u.role });
    setShowForm(true);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="font-sans w-full flex flex-col">
      {/* ກາດບັນຈຸຫຼັກຂອງໜ້າຈັດການຜູ້ໃຊ້ງານ (Main Container Card) */}
      <div className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-hidden bg-[#FFFAEE] border-0 flex flex-col" style={{ borderRadius: 0 }}>
        
        {/* ແຖບຫົວດ້ານເທິງ (Header Bar) ພື້ນຫຼັງສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 sm:px-4 md:px-6 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ສ່ວນຫົວຂໍ້ດ້ານຊ້າຍ: ໄອຄອນ ແລະ ຊື່ໜ້າຈັດການ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <SvgIcon raw={usersIcon} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ຈັດການ
              </h1>
            </div>
          </div>

          {/* ສ່ວນດ້ານຂວາ: ກ່ອງຄົ້ນຫາ ແລະ ປຸ່ມເພີ່ມຜູ້ໃຊ້ງານໃໝ່ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full md:w-auto shrink-0">
            {/* ກ່ອງປ້ອນຂໍ້ຄວາມຄົ້ນຫາຜູ້ໃຊ້ງານ (Search Input Box) */}
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <SvgIcon raw={userSearchIcon} className="w-5 h-5 text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="userSearchFilter"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາຜູ້ໃຊ້"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!searchQuery.trim()) {
                      toast.error('ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ');
                      return;
                    }
                    setCurrentPage(1);
                  }
                }}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <SvgIcon raw={xIcon} className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!searchQuery.trim()) {
                    toast.error('ກະລຸນາໃສ່ຊື່ຜູ້ໃຊ້ ຫຼື ອີເມວ');
                    return;
                  }
                  setCurrentPage(1);
                }}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center shrink-0 cursor-pointer"
              >
                ຄົ້ນຫາ
              </button>
            </div>

            {/* ປຸ່ມເພີ່ມຜູ້ໃຊ້ງານໃໝ່ (Add User Button) */}
            <button
              onClick={() => {
                setShowForm(true);
                setEditing(null);
                setForm({ username: '', email: '', password: '', displayName: '', role: 'STAFF' });
              }}
              className="bg-white hover:bg-gray-100 text-[#232323] px-5 h-10 rounded-full font-bold shadow-md transition-all text-base md:text-[17px] shrink-0 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <SvgIcon raw={userPlusIcon} className="w-5 h-5 text-[#232323]" />
              <span>ເພີ່ມ User</span>
            </button>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* ສ່ວນຕາຕະລາງສະແດງລາຍການຜູ້ໃຊ້ງານ (Table Content) */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr
                className="bg-gradient-to-r from-[#4C4C4C] via-[#6E6E6E] to-[#A8A8A8] text-white text-base md:text-[17px] font-bold h-16"
                style={{ background: 'linear-gradient(90deg, #4C4C4C 0%, #6E6E6E 50%, #A8A8A8 100%)' }}
              >
                <th className="px-3 border-r border-white/30 w-16 text-base md:text-[17px] font-bold align-middle">ລ/ດ</th>
                <th className="px-6 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-left">ຜູ້ໃຊ້</th>
                <th className="px-6 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-left">ອີເມວ</th>
                <th className="px-4 border-r border-white/30 w-36 text-base md:text-[17px] font-bold align-middle">ສິດ</th>
                <th className="px-4 w-32 text-base md:text-[17px] font-bold align-middle">ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr className="h-16">
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-bold bg-[#FFFAEE] text-base md:text-[17px] align-middle">
                    ບໍ່ມີຂໍ້ມູນຜູ້ໃຊ້
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isEvenRow = idx % 2 === 1;
                  const rowBg = isEvenRow ? 'bg-[#FFFAEE]' : 'bg-[#FDF1D7]';
                  const borderClass = isEvenRow ? 'border-r border-gray-200' : 'border-r border-[#EADFC7]';
                  const rowNumber = String((currentPage - 1) * ITEMS_PER_PAGE + idx + 1).padStart(2, '0');

                  return (
                    <tr
                      key={u.id}
                      className={`${rowBg} hover:bg-[#EAD0A0] transition-colors duration-150 text-base md:text-[17px] font-bold text-gray-800 h-14 cursor-default`}
                    >
                      {/* ຖັນທີ 1: ລຳດັບ (Column 1: No.) */}
                      <td className={`px-3 ${borderClass} text-base md:text-[17px] font-bold align-middle`}>
                        {rowNumber}
                      </td>

                      {/* ຖັນທີ 2: ຊື່ຜູ້ໃຊ້ງານ (Column 2: DisplayName / Username) */}
                      <td className={`px-6 ${borderClass} truncate max-w-[200px] text-base md:text-[17px] font-bold align-middle text-left`}>
                        {u.displayName || u.username}
                      </td>

                      {/* ຖັນທີ 3: ທີ່ຢູ່ອີເມວ (Column 3: Email) */}
                      <td className={`px-6 ${borderClass} truncate max-w-[240px] text-base md:text-[17px] font-bold align-middle text-left`}>
                        {u.email || '-'}
                      </td>

                      {/* ຖັນທີ 4: ສິດທິການນຳໃຊ້ (Column 4: Role) */}
                      <td className={`px-4 ${borderClass} text-base md:text-[17px] font-bold align-middle`}>
                        {u.role}
                      </td>

                      {/* ຖັນທີ 5: ປຸ່ມຈັດການ ແກ້ໄຂ ແລະ ລຶບ (Column 5: Action Buttons) */}
                      <td className="px-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            title="ແກ້ໄຂ"
                            className="w-9 h-9 rounded flex items-center justify-center bg-[#F9A825] hover:bg-[#e0921a] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <SvgIcon raw={squarePenIcon} className="w-5 h-5 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(u.id, u.displayName || u.username)}
                            title="ລຶບ"
                            className="w-9 h-9 rounded flex items-center justify-center bg-[#B02019] hover:bg-[#961b15] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <SvgIcon raw={trashIcon} className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* ແຖບສ່ວນທ້າຍ ແລະ ປຸ່ມປ່ຽນໜ້າ (Footer / Pagination Bar) */}
        <div
          className="bg-[#5D5D5D] px-3 sm:px-4 md:px-6 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ສະແດງຈຳນວນລາຍການຜູ້ໃຊ້ງານທັງໝົດ */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 min-w-[40px] px-3.5 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {filteredUsers.length}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* ດ້ານຂວາ: ປຸ່ມຄວບຄຸມການປ່ຽນໜ້າ (Pagination Controls) */}
          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ຖອຍກັບ
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);
                return page >= start && page <= end;
              })
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 flex items-center justify-center font-bold text-base md:text-[17px] shadow-sm transition-colors text-white rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                    currentPage === page
                      ? 'bg-[#B02019]'
                      : 'bg-[#B02019] hover:bg-[#961b15]'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {page}
                </button>
              ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ໄປໜ້າ
            </button>
          </div>
        </div>
      </div>

      {/* ໜ້າຕ່າງປັອບອັບ ເພີ່ມ ຫຼື ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ງານ (Add / Edit User Modal) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="bg-[#FFF9EE] w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-scale-in"
            style={{ borderRadius: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ແຖບຫົວໜ້າຕ່າງປັອບອັບ (Modal Header) */}
            <div className="bg-[#5D5D5D] px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SvgIcon raw={userPlusIcon} className="w-5 h-5 text-white" />
                <h2 className="text-base md:text-[18px] font-bold text-white tracking-normal">
                  {editing ? 'ແກ້ໄຂ Users' : 'ເພີ່ມ Users'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform active:scale-95"
                title="ປິດ"
              >
                <SvgIcon raw={xIcon} className="w-4 h-4 text-[#5D5D5D]" />
              </button>
            </div>

            {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ຟອມປ້ອນຂໍ້ມູນຜູ້ໃຊ້ງານ (Modal Form) */}
            <form
              onSubmit={e => { e.preventDefault(); handleSave(); }}
              autoComplete="off"
            >
              <div className="p-6 space-y-4">
                {/* 1. ຊື່ເຂົ້າສູ່ລະບົບ (UserName) */}
                {!editing && (
                  <div>
                    <label className="block text-base font-bold text-[#333333] mb-1.5">
                      UserName
                    </label>
                    <div className="relative flex items-center bg-white border-2 border-[#555555]">
                      <span className="pl-3.5 text-gray-500 flex items-center">
                        <SvgIcon raw={userIcon} className="w-5 h-5 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        name="app_user_username"
                        autoComplete="off"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        className="w-full px-3 py-2.5 bg-transparent focus:outline-none font-bold text-base text-gray-800 placeholder-gray-400"
                        placeholder="UserName"
                      />
                    </div>
                  </div>
                )}

                {/* 2. ຊື່ສະແດງຂອງຜູ້ໃຊ້ (DisplayName) */}
                <div>
                  <label className="block text-base font-bold text-[#333333] mb-1.5">
                    DisplayName
                  </label>
                  <div className="relative flex items-center bg-white border-2 border-[#555555]">
                    <span className="pl-3.5 text-gray-500 flex items-center">
                      <SvgIcon raw={userIcon} className="w-5 h-5 text-gray-500" />
                    </span>
                    <input
                      type="text"
                      name="app_user_displayname"
                      autoComplete="off"
                      value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-transparent focus:outline-none font-bold text-base text-gray-800 placeholder-gray-400"
                      placeholder="DisplayName"
                    />
                  </div>
                </div>

                {/* 3. ອີເມວຕິດຕໍ່ (Email) */}
                <div>
                  <label className="block text-base font-bold text-[#333333] mb-1.5">
                    Email
                  </label>
                  <div className="relative flex items-center bg-white border-2 border-[#555555]">
                    <span className="pl-3.5 text-gray-500 flex items-center">
                      <SvgIcon raw={mailIcon} className="w-5 h-5 text-gray-500" />
                    </span>
                    <input
                      type="email"
                      name="app_user_email"
                      autoComplete="off"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 bg-transparent focus:outline-none font-bold text-base text-gray-800 placeholder-gray-400"
                      placeholder="Email"
                    />
                  </div>
                </div>

                {/* 4. ລະຫັດຜ່ານ (Password) */}
                <div>
                  <label className="block text-base font-bold text-[#333333] mb-1.5">
                    PassWord
                  </label>
                  <div className="relative flex items-center bg-white border-2 border-[#555555]">
                    <span className="pl-3.5 text-gray-500 flex items-center">
                      <SvgIcon raw={lockIcon} className="w-5 h-5 text-gray-500" />
                    </span>
                    <input
                      type="password"
                      name="app_user_password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 bg-transparent focus:outline-none font-bold text-base text-gray-800 placeholder-gray-400"
                      placeholder={editing ? "ປ່ຽນລະຫັດຜ່ານໃໝ່ (ປ່ອຍວ່າງຖ້າບໍ່ປ່ຽນ)" : "PassWord"}
                    />
                  </div>
                </div>

                {/* 5. ສິດທິການນຳໃຊ້ (Role: STAFF ຫຼື ADMIN) */}
                <div>
                  <label className="block text-base font-bold text-[#333333] mb-1.5">
                    Role
                  </label>
                  <div className="relative flex items-center bg-white border-2 border-[#555555]">
                    <select
                      name="app_user_role"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-transparent focus:outline-none font-bold text-base text-gray-800 cursor-pointer"
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
              <div className="h-[2.5px] bg-[#B02019] w-full" />

              {/* ສ່ວນທ້າຍໜ້າຕ່າງປັອບອັບ ພ້ອມປຸ່ມບັນທຶກ (Modal Footer) */}
              <div className="bg-[#5D5D5D] px-6 h-16 flex items-center justify-center">
                <button
                  type="submit"
                  className="bg-white hover:bg-gray-100 text-[#232323] font-bold px-8 h-10 text-base md:text-[17px] shadow transition-colors flex items-center justify-center gap-2 active:scale-95 rounded-none"
                  style={{ borderRadius: 0 }}
                >
                  <SvgIcon raw={saveIcon} className="w-5 h-5 text-[#232323]" />
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ໜ້າຕ່າງປັອບອັບຢືນຢັນການລຶບຜູ້ໃຊ້ງານ (Delete Confirmation Modal) */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 animate-scale-in"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-[#FFF9EE] w-full max-w-md shadow-2xl rounded-none overflow-hidden"
            style={{ borderRadius: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ສ່ວນຫົວໜ້າຕ່າງປັອບອັບ (Modal Header) */}
            <div className="bg-[#5D5D5D] px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SvgIcon raw={trashIcon} className="w-5 h-5 text-white" />
                <h3 className="text-base md:text-[18px] font-bold text-white tracking-normal">
                  ຢືນຢັນການລຶບຜູ້ໃຊ້
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform cursor-pointer"
                title="ປິດ"
              >
                <SvgIcon raw={xIcon} className="w-4 h-4 text-[#5D5D5D]" />
              </button>
            </div>

            {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ເນື້ອໃນຂໍ້ຄວາມຢືນຢັນ (Modal Body) */}
            <div className="p-6 text-center bg-[#FFF9EE]">
              <p className="text-base md:text-[17px] font-bold text-red-600 mb-2 leading-relaxed">
                ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ໃຊ້ "{deleteConfirm.name}" ຖາວອນ?
              </p>
              <p className="text-sm text-gray-600 font-bold">
                ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້ ຂໍ້ມູນຈະຖືກລຶບອອກຈາກລະບົບທັນທີ.
              </p>
            </div>

            {/* ເສັ້ນຂັ້ນສີແດງ (Red Stripe Divider) */}
            <div className="h-[2.5px] bg-[#B02019] w-full" />

            {/* ສ່ວນທ້າຍປຸ່ມຄຳສັ່ງ (Modal Footer) */}
            <div className="bg-[#5D5D5D] px-6 py-3.5 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  const id = deleteConfirm.id;
                  setDeleteConfirm(null);
                  executeDelete(id);
                }}
                className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-6 rounded-none shadow-md transition-all active:scale-95 text-[15px] cursor-pointer flex items-center justify-center gap-2"
                style={{ borderRadius: 0 }}
              >
                <SvgIcon raw={trashIcon} className="w-4 h-4 text-white" />
                <span>ລຶບເລີຍ</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="bg-white hover:bg-gray-100 text-[#232323] font-bold h-10 px-6 rounded-none shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
                style={{ borderRadius: 0 }}
              >
                ຍົກເລີກ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
