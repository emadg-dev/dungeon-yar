import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { Invite, Character } from '../../types';
import { api } from '../../services/api';
import { BottomSheet } from '../mobile/BottomSheet';
import {
  Field, Badge, IconButton, StickyFooter, Tone,
  inputCls, primaryBtnCls, secondaryBtnCls
} from '../ui/FormLayout';
import { KeyRound, Plus, Copy, Check, X, Trash2, Sparkles } from 'lucide-react';

interface DmInvitesProps {
  characters: Character[];
}

const formatDate = (ts: number) => new Date(ts).toLocaleDateString('fa-IR-u-nu-latn');

const getStatus = (inv: Invite): { label: string; tone: Tone } => {
  if (inv.revokedAt) return { label: 'باطل‌شده', tone: 'danger' };
  if (inv.expiresAt > 0 && inv.expiresAt < Date.now()) return { label: 'منقضی‌شده', tone: 'warning' };
  if (inv.usedCount >= inv.maxUses) return { label: 'مصرف‌شده', tone: 'neutral' };
  return { label: 'فعال', tone: 'success' };
};

export const DmInvites: React.FC<DmInvitesProps> = ({ characters }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [label, setLabel] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [assignCharacterId, setAssignCharacterId] = useState('');

  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState<Invite | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      setInvites(await api.listInvites());
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در دریافت لیست دعوت‌ها', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const inv = await api.createInvite({
        label: label.trim() || 'دعوت جدید',
        expiresInDays,
        maxUses,
        assignCharacterId: assignCharacterId || undefined
      });
      setNewlyCreatedInvite(inv);
      setShowCreateForm(false);
      setLabel('');
      setAssignCharacterId('');
      loadInvites();
      setMessage({ text: 'کد دعوت صادر شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در صدور کد دعوت', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('این کد دعوت باطل شود؟ دیگر نمی‌توان با آن ثبت‌نام کرد.')) return;
    try {
      await api.revokeInvite(inviteId);
      loadInvites();
      setMessage({ text: 'کد دعوت باطل شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'خطا در ابطال دعوت', type: 'error' });
    }
  };

  const copyText = async (text: string, isLink: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setMessage({ text: 'کپی انجام نشد؛ متن را دستی انتخاب کنید.', type: 'error' });
      return;
    }
    const setter = isLink ? setCopiedLink : setCopiedCode;
    setter(true);
    setTimeout(() => setter(false), 3000);
  };

  const inviteLink = newlyCreatedInvite
    ? newlyCreatedInvite.inviteLink || `${window.location.origin}/#register?code=${newlyCreatedInvite.code}`
    : '';

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header: title + the one primary action */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" aria-hidden />
            <span>کدهای دعوت</span>
          </h3>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            پیوند ثبت‌نام بسازید و در صورت نیاز یک کاراکتر را خودکار به بازیکن اختصاص دهید.
          </p>
        </div>
        <Button type="button" onClick={() => setShowCreateForm(true)} className={`${primaryBtnCls} shrink-0`}>
          <Plus className="w-4 h-4 shrink-0" />
          <span>دعوت جدید</span>
        </Button>
      </div>

      {message && (
        <div
          role="alert"
          className={`pe-1 ps-3 rounded-lg text-sm flex items-center justify-between gap-2 border ${
            message.type === 'success'
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-danger/15 text-danger border-danger/30'
          }`}
        >
          <span className="py-2.5">{message.text}</span>
          <IconButton label="بستن پیام" onClick={() => setMessage(null)}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {/* Result of creation: the only moment the link matters, so it gets emphasis */}
      {newlyCreatedInvite && (
        <section className="rounded-xl border border-accent/40 bg-accent/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-accent-hover flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden />
              کد دعوت ساخته شد
            </h4>
            <IconButton label="بستن" onClick={() => setNewlyCreatedInvite(null)}>
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          <p className="text-sm text-text-primary">پیوند زیر را برای بازیکن بفرستید:</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input noWrapper type="text" readOnly dir="ltr" value={inviteLink} aria-label="پیوند ثبت‌نام"
              className={`${inputCls} flex-1 font-mono select-all`} />
            <Button type="button" onClick={() => copyText(inviteLink, true)} className={primaryBtnCls}>
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'کپی شد' : 'کپی پیوند'}</span>
            </Button>
          </div>

          {newlyCreatedInvite.code && (
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span>کد کوتاه:</span>
              <code className="font-mono font-bold text-accent-hover">{newlyCreatedInvite.code}</code>
              <Button type="button" onClick={() => copyText(newlyCreatedInvite.code!, false)}
                className="min-h-[44px] px-2 text-sm text-accent-hover underline">
                {copiedCode ? 'کپی شد' : 'کپی کد'}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* List */}
      {invites.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted">
          {loading ? 'در حال بارگذاری...' : 'هنوز کد دعوتی صادر نشده است.'}
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
          {invites.map(inv => {
            const status = getStatus(inv);
            const assigned = inv.assignCharacterId
              ? characters.find(c => c.id === inv.assignCharacterId)?.name || 'اختصاصی'
              : null;
            return (
              <li key={inv.id} className="p-3 sm:p-4 flex items-center gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text-primary truncate">{inv.label || 'دعوت'}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>مصرف: {inv.usedCount} از {inv.maxUses}</span>
                    <span>انقضا: {inv.expiresAt > 0 ? formatDate(inv.expiresAt) : 'بدون انقضا'}</span>
                    {assigned && <span className="text-text-primary">کاراکتر: {assigned}</span>}
                  </p>
                </div>

                {!inv.revokedAt && (
                  <IconButton label="ابطال این دعوت" danger onClick={() => handleRevoke(inv.id)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Create form lives in a sheet, like every other editor in the app */}
      <BottomSheet
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="دعوت جدید"
        subtitle="مشخصات کد دعوت را وارد کنید"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4" dir="rtl">
          <Field label="عنوان دعوت" hint="فقط برای شناسایی خودتان در فهرست.">
            <Input noWrapper type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="مثال: دعوت علی (بازیکن سامان)" className={inputCls} />
          </Field>

          <Field label="کاراکتر اختصاصی (اختیاری)">
            <Select noWrapper value={assignCharacterId} onChange={e => setAssignCharacterId(e.target.value)} className={inputCls}>
              <option value="">بدون کاراکتر؛ بعداً توسط DM انتخاب می‌شود</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.className}، سطح {c.level})</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="اعتبار (روز)">
              <Input noWrapper type="number" inputMode="numeric" min="1" max="365" value={expiresInDays}
                onChange={e => setExpiresInDays(parseInt(e.target.value, 10) || 30)} className={inputCls} />
            </Field>
            <Field label="حداکثر دفعات استفاده">
              <Input noWrapper type="number" inputMode="numeric" min="1" max="50" value={maxUses}
                onChange={e => setMaxUses(parseInt(e.target.value, 10) || 1)} className={inputCls} />
            </Field>
          </div>

          <StickyFooter>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className={`${primaryBtnCls} flex-1 sm:flex-none`}>
                {loading ? 'در حال ساخت...' : 'ساخت دعوت'}
              </Button>
              <Button type="button" onClick={() => setShowCreateForm(false)} className={secondaryBtnCls}>انصراف</Button>
            </div>
          </StickyFooter>
        </form>
      </BottomSheet>
    </div>
  );
};