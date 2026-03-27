'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Users, Trophy, Send, RefreshCw, Trash2 } from 'lucide-react';

interface Soldier {
  id: string;
  full_name: string;
  department_id: string;
}

export default function ZodiacWheel({ soldiers }: { soldiers: Soldier[] }) {
  const [selectedSoldiers, setSelectedSoldiers] = useState<Soldier[]>([]);
  const [winnerCount, setWinnerCount] = useState(1);
  const [winners, setWinners] = useState<Soldier[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addToWheel = (soldier: Soldier) => {
    if (!selectedSoldiers.find(s => s.id === soldier.id)) {
      setSelectedSoldiers([...selectedSoldiers, soldier]);
    }
  };

  const onDragStart = (e: React.DragEvent, soldier: Soldier) => {
    e.dataTransfer.setData('soldier', JSON.stringify(soldier));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    const soldierData = e.dataTransfer.getData('soldier');
    if (soldierData) {
      const soldier = JSON.parse(soldierData);
      addToWheel(soldier);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(true);
  };

  const removeFromWheel = (id: string) => {
    setSelectedSoldiers(selectedSoldiers.filter(s => s.id !== id));
  };

  const spin = () => {
    if (selectedSoldiers.length < 2) {
      alert('צריך לפחות 2 חיילים בגלגל');
      return;
    }
    setWinners([]);
    setMessageSent(false);
    setIsSpinning(true);

    const extraRounds = 5 + Math.random() * 5;
    const newRotation = rotation + extraRounds * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Pick random winners
      const shuffled = [...selectedSoldiers].sort(() => 0.5 - Math.random());
      setWinners(shuffled.slice(0, Math.min(winnerCount, selectedSoldiers.length)));
    }, 4000);
  };

  const sendWinnerMessage = async () => {
    if (winners.length === 0) return;
    setSending(true);

    try {
      for (const winner of winners) {
        await supabase.from('messages').insert({
          title: '🎊 זכית בהגרלת גלגל המזלות!',
          content: `שלום ${winner.full_name}, ברכותינו! שמך עלה בגלגל המזלות הפלוגתי. נא לפנות לסגל לקבלת הפרס/המשימה.`,
          target_soldier_id: winner.id,
          created_by: 'מערכת גלגל המזלות'
        });
      }
      setMessageSent(true);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    if (selectedSoldiers.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#333';
      ctx.stroke();
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('הוסף חיילים לגלגל', centerX, centerY);
      return;
    }

    const sliceAngle = (Math.PI * 2) / selectedSoldiers.length;

    selectedSoldiers.forEach((soldier, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();

      // Alternating colors
      ctx.fillStyle = `hsl(${(i * 360) / selectedSoldiers.length}, 70%, 50%)`;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();

      // Add text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Heebo';
      ctx.fillText(soldier.full_name.split(' ')[0], radius - 10, 5);
      ctx.restore();
    });
  }, [selectedSoldiers]);

  const filteredSoldiers = (soldiers || []).filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="zodiac-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card 
          onDragOver={onDragOver}
          onDragLeave={() => setIsDraggedOver(false)}
          onDrop={onDrop}
          style={{ 
            padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden',
            border: isDraggedOver ? '2px dashed var(--accent)' : 'none',
            background: isDraggedOver ? 'var(--accent)11' : 'inherit',
            transition: 'all 0.2s'
          }}
        >
          <h2 style={{ marginBottom: 20 }}>🎡 גלגל המזלות הפלוגתי</h2>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* The Pointer */}
            <div style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, fontSize: '2rem'
            }}>👇</div>
            
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={300} 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none',
                borderRadius: '50%',
                boxShadow: '0 0 20px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={spin} 
              disabled={isSpinning || selectedSoldiers.length < 2}
              style={{ padding: '12px 40px', fontSize: '1.2rem' }}
            >
              {isSpinning ? 'מסובב...' : '🎰 סובב את הגלגל!'}
            </Button>
          </div>

          {winners.length > 0 && !isSpinning && (
            <div className="animate-bounce" style={{ marginTop: 20, padding: 16, background: 'var(--accent)22', borderRadius: 12, border: '2px solid var(--accent)' }}>
              <h3 style={{ color: 'var(--accent)', fontWeight: 800 }}>🏆 הזוכים המאושרים:</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                {winners.map(w => (
                  <Badge key={w.id} style={{ fontSize: '1.1rem', padding: '8px 16px' }}>{w.full_name}</Badge>
                ))}
              </div>
              
              <div style={{ marginTop: 16 }}>
                <Button 
                  variant="secondary" 
                  onClick={sendWinnerMessage} 
                  disabled={sending || messageSent}
                  style={{ display: 'flex', gap: 8, margin: '0 auto' }}
                >
                  {messageSent ? '✅ הודעה נשלחה בהצלחה' : (sending ? 'שולח...' : <><Send size={16} /> שלח הודעה אישית לזוכים</>)}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>👥 חיילים בגלגל ({selectedSoldiers.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.9rem' }}>מספר זוכים:</span>
              <Input 
                type="number" 
                value={winnerCount} 
                onChange={e => setWinnerCount(parseInt(e.target.value) || 1)}
                style={{ width: 60, marginBottom: 0 }}
                min={1}
                max={selectedSoldiers.length}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedSoldiers.map(s => (
              <Badge key={s.id} variant="gray" style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4 }}>
                {s.full_name}
                <button onClick={() => removeFromWheel(s.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2 }}>
                  <Trash2 size={12} />
                </button>
              </Badge>
            ))}
            {selectedSoldiers.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>גרור חיילים לכאן או לחץ על הפלוס ברשימה</p>
            )}
          </div>
          
          {selectedSoldiers.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedSoldiers([])} style={{ marginTop: 12 }}>
              <RefreshCw size={14} style={{ marginLeft: 6 }} /> נקה הכל
            </Button>
          )}
        </Card>
      </div>

      <Card style={{ padding: 16, height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} /> רשימת הפלוגה
        </h3>
        
        <Input 
          placeholder="חיפוש חייל..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredSoldiers.map(s => (
            <div 
              key={s.id} 
              draggable={!selectedSoldiers.find(sel => sel.id === s.id)}
              onDragStart={(e) => onDragStart(e, s)}
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8,
                opacity: selectedSoldiers.find(sel => sel.id === s.id) ? 0.5 : 1,
                cursor: selectedSoldiers.find(sel => sel.id === s.id) ? 'default' : 'grab'
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>{s.full_name}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => addToWheel(s)}
                disabled={!!selectedSoldiers.find(sel => sel.id === s.id)}
                style={{ padding: '2px 8px', height: 28 }}
              >
                +
              </Button>
            </div>
          ))}
          {filteredSoldiers.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20 }}>לא נמצאו חיילים</p>
          )}
        </div>
      </Card>

      <style jsx>{`
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
      `}</style>
    </div>
  );
}
