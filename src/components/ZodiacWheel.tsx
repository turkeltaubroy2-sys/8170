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
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Soldier | null>(null);

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

  const spin = async () => {
    if (selectedSoldiers.length < 2) {
      alert('צריך לפחות 2 חיילים בגלגל');
      return;
    }
    setIsSpinning(true);
    setWinners([]);
    setCurrentWinner(null);
    setMessageSent(false);
    setShowConfetti(false);

    const rounds = Math.min(winnerCount, selectedSoldiers.length);
    const newWinners: Soldier[] = [];
    let currentRotation = rotation;

    for (let i = 0; i < rounds; i++) {
      // Pick winner first
      const available = selectedSoldiers.filter(s => !newWinners.find(nw => nw.id === s.id));
      const winner = available[Math.floor(Math.random() * available.length)];
      const winnerIndex = selectedSoldiers.findIndex(s => s.id === winner.id);
      
      const sliceAngle = 360 / selectedSoldiers.length;
      // Target angle to put the slice at the top (pointer is at top)
      // Top is 0 degrees in our logic because we draw from 0.
      // Wait, canvas draws 0 at 3 o'clock. We rotate the canvas.
      // If we rotate the canvas by R, then the slice at angle A will be at R+A.
      // We want R+A to be at the top. Top is 270 degrees (or -90).
      // So R = 270 - A.
      // A for winnerIndex is (winnerIndex + 0.5) * sliceAngle.
      const targetAngle = 270 - (winnerIndex + 0.5) * sliceAngle;
      
      const extraRounds = 4 + Math.random() * 2;
      // Make sure we always rotate FORWARD
      let finalRotation = currentRotation + (targetAngle - (currentRotation % 360)) + extraRounds * 360;
      if (finalRotation <= currentRotation) finalRotation += 360;
      
      currentRotation = finalRotation;
      setRotation(currentRotation);

      await new Promise(resolve => setTimeout(resolve, 3100));

      newWinners.push(winner);
      setCurrentWinner(winner);
      setShowConfetti(true);
      
      if (i < rounds - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowConfetti(false);
        setCurrentWinner(null);
      }
    }

    setWinners(newWinners);
    setIsSpinning(false);
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

      // Alternating colors with gradients
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      const baseHue = (i * 360) / selectedSoldiers.length;
      grad.addColorStop(0, `hsl(${baseHue}, 80%, 40%)`);
      grad.addColorStop(1, `hsl(${baseHue}, 70%, 50%)`);
      
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add text with shadow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 14px Heebo';
      ctx.fillText(soldier.full_name.split(' ')[0], radius - 20, 5);
      ctx.restore();
    });

    // Outer glow/border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
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
                transition: isSpinning ? 'transform 3s cubic-bezier(0.15, 0, 0.15, 1)' : 'none',
                borderRadius: '50%',
                boxShadow: '0 0 30px rgba(0,0,0,0.4)',
                border: '8px solid #333'
              }}
            />
          </div>

          {showConfetti && (
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="confetti-piece" style={{ 
                  left: `${Math.random() * 100}%`,
                  background: `hsl(${Math.random() * 360}, 100%, 50%)`,
                  animationDelay: `${Math.random() * 2}s`
                }} />
              ))}
            </div>
          )}

          {currentWinner && (
            <div className="winner-popup animate-popup">
              <h2 style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎉 {currentWinner.full_name}!</h2>
              <p>זכית בסיבוב!</p>
            </div>
          )}

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
        .confetti-container {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          z-index: 50;
        }
        .confetti-piece {
          position: absolute;
          width: 10px; height: 20px;
          top: -20px;
          animation: fall 3s linear forwards;
        }
        @keyframes fall {
          to { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        .winner-popup {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255,255,255,0.95);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          z-index: 100;
          border: 4px solid var(--accent);
          color: var(--text);
        }
        .animate-popup {
          animation: popin 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popin {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
