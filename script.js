:root{
  --bg: #f8fbff;
  --accent: #0ea5e9;
  --muted: #94a3b8;
  --panel: rgba(2,6,23,0.85);
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue";
  background: linear-gradient(180deg,#e6f7ff 0%, #ffffff 100%);
  color:#071133;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:18px;
  padding:18px;
}
header{
  width:100%;
  max-width:1000px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
header h1{font-size:20px;letter-spacing:0.6px}
.score{color:var(--muted); font-weight:600}
main{
  width:100%;
  max-width:1000px;
  position:relative;
}
canvas{
  width:100%;
  background:linear-gradient(180deg,#dff6ff 0%, #fff 100%);
  border-radius:12px;
  box-shadow:0 10px 30px rgba(2,6,23,0.06);
  display:block;
}
#overlay{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  pointer-events:none;
}
#overlay.hidden{display:none; pointer-events:none;}
.panel{
  pointer-events:auto;
  background:var(--panel);
  color:white;
  padding:22px;
  border-radius:12px;
  text-align:center;
  min-width:240px;
  transform:translateY(0);
}
.panel h2{margin-bottom:8px;font-size:20px}
.panel p{color:#cfe9ff;margin-bottom:14px}
#btn-restart{
  background:var(--accent);
  color:white;border:0;padding:10px 16px;border-radius:8px;
  cursor:pointer;font-weight:700;
}
footer{color:var(--muted);font-size:13px;max-width:1000px;text-align:center}
@media (max-width:640px){
  .panel{min-width:200px;padding:16px}
  header h1{font-size:18px}
}
