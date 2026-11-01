/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConflictDetails, getFieldLabelFa } from '../../../shared/rules/offlineEngine';
import { AlertTriangle, Check, RotateCcw, ShieldAlert } from 'lucide-react';

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictDetails[];
  onResolve: (conflictId: string, strategy: 'client' | 'server') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve,
}) => {
  const formatValue = (val: any) => {
    if (val === null || val === undefined) return 'خالی';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="مغایرت در همگام‌سازی آفلاین">
      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto" dir="rtl">
        <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-[#E0A030]/10 border border-[#E0A030]/30 text-[#F2C265] text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#E0A030] mt-0.5" />
          <div>
            <p className="font-bold">تغییرات هم‌زمان در سرور ثبت شده است</p>
            <p className="text-[#A39A89] mt-1">
              در زمانی که شما به صورت آفلاین این مقادیر را تغییر می‌دادید، نسخه جدیدتری روی سرور ذخیره شده است. لطفاً برای هر مورد انتخاب کنید که کدام نسخه حفظ شود.
            </p>
          </div>
        </div>

        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-[#A39A89] text-sm">
            هیچ مغایرتی وجود ندارد. همه تغییرات با سرور همگام هستند.
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-[12px] bg-[#171513] border border-[#2F2A23] space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-[#2F2A23] pb-2">
                  <span className="font-black text-[#EDE6D8]">
                    {getFieldLabelFa(c.field)}
                  </span>
                  <span className="text-[11px] text-[#A39A89] font-mono">
                    سرور v{c.serverRevision} • پایه v{c.baseRevision}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Client offline edit */}
                  <div className="p-2.5 rounded-[8px] bg-[#201D19] border border-[#E0A030]/30 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#E0A030] font-bold">
                      <span>تغییر شما (آفلاین)</span>
                    </div>
                    <pre className="text-[#EDE6D8] font-mono text-[11px] whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {formatValue(c.clientValue)}
                    </pre>
                  </div>

                  {/* Server current value */}
                  <div className="p-2.5 rounded-[8px] bg-[#201D19] border border-[#2F2A23] space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#A39A89] font-bold">
                      <span>نسخه روی سرور</span>
                    </div>
                    <pre className="text-[#EDE6D8] font-mono text-[11px] whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {formatValue(c.serverValue)}
                    </pre>
                  </div>
                </div>

                {/* Resolution Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onResolve(c.id, 'client')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-black text-xs transition touch-target"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>حفظ تغییر من</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(c.id, 'server')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-[#201D19] hover:bg-[#2A2520] border border-[#2F2A23] text-[#EDE6D8] font-bold text-xs transition touch-target"
                  >
                    <RotateCcw className="w-4 h-4 text-[#A39A89]" />
                    <span>پذیرش نسخه سرور</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-[10px] bg-[#201D19] text-[#EDE6D8] text-xs font-bold hover:bg-[#2A2520] transition touch-target"
          >
            بستن
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
