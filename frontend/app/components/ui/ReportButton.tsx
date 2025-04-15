import { useState } from 'react';
import { MdOutlineReportProblem } from 'react-icons/md';

interface ReportButtonProps {
  propertyId: string;
}

const reportReasons = [
  'Продано/сдано или предлагают другие объекты',
  'Фото, адрес, цена или описание объекта неверные',
  'Не берут трубку или номер ошибочный',
  'Мошенничество, правовые вопросы',
  'Оскорбления, дискриминация, неприемлемые условия',
  'Объявление размещено без согласия собственника'
];

export const ReportButton = ({ propertyId }: ReportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    try {
      // TODO: Implement API call to submit report
      console.log({
        propertyId,
        reason: selectedReason,
        comment
      });
      
      // Reset form and close modal
      setStep(1);
      setSelectedReason('');
      setComment('');
      setIsOpen(false);
    } catch (error) {
      console.error('Ошибка при отправке жалобы:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors"
        title="Пожаловаться"
      >
        <MdOutlineReportProblem className="w-5 h-5 text-red-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white rounded-2xl shadow-xl p-6 z-40">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Жалоба на объявление
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {step === 1 ? (
              <div className="space-y-3">
                {reportReasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => {
                        setSelectedReason(e.target.value);
                        setStep(2);
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пожалуйста, напишите подробности или укажите ваш e-mail для связи
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 resize-none"
                    placeholder="Опишите проблему..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}; 