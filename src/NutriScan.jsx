import React, { useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const COLORS = {
  ink: "#1F3327",
  paper: "#F3EFE4",
  card: "#FFFDF7",
  green: "#4C7A3F",
  greenDark: "#345629",
  red: "#C1442B",
  gold: "#C9880F",
  sage: "#C9C3AE",
  sageText: "#6E6A57",
};

function stripFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function NutriScan() {
  const [stage, setStage] = useState("email"); // email | code | app
  const [mode, setMode] = useState("login"); // login | signup
  const [users, setUsers] = useState({}); // { email: password } — solo en memoria, para la demo
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [imageData, setImageData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const isGmail = (addr) => /^[^\s@]+@gmail\.com$/i.test(addr.trim());

  function handleSendCode() {
    setAuthError("");
    if (!isGmail(email)) {
      setAuthError("Ingresa una dirección @gmail.com válida.");
      return;
    }
    if (password.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (mode === "signup") {
      if (users[email]) {
        setAuthError("Ya existe una cuenta con ese correo. Inicia sesión.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Las contraseñas no coinciden.");
        return;
      }
    } else {
      if (!users[email]) {
        setAuthError("No existe una cuenta con ese correo. Crea una cuenta.");
        return;
      }
      if (users[email] !== password) {
        setAuthError("Contraseña incorrecta.");
        return;
      }
    }

    const code = randomCode();
    setSentCode(code);
    setStage("code");
  }

  function handleVerifyCode() {
    if (codeInput.trim() === sentCode) {
      setAuthError("");
      if (mode === "signup") {
        setUsers((u) => ({ ...u, [email]: password }));
      }
      setStage("app");
    } else {
      setAuthError("Código incorrecto. Revisa el código de demo mostrado arriba.");
    }
  }

  function switchMode(next) {
    setMode(next);
    setAuthError("");
    setPassword("");
    setConfirmPassword("");
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setResult(null);
    setScanError("");
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imageData) return;
    setAnalyzing(true);
    setScanError("");
    setResult(null);
    try {
      const base64 = imageData.split(",")[1];
      const mediaType = imageData.substring(5, imageData.indexOf(";"));

      // Llama a tu propio backend (api/analyze.js) en vez de a Anthropic
      // directamente, así la API key nunca queda expuesta en el navegador.
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Error del servidor de análisis.");
      }

      const parsed = await response.json();
      setResult(parsed);
      setHistory((h) => [{ ...parsed, id: Date.now() }, ...h].slice(0, 8));
    } catch (err) {
      setScanError("No se pudo analizar la imagen. Intenta con otra foto.");
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setImageData(null);
    setResult(null);
    setScanError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const fontImport =
    "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');";

  const chartData = result
    ? [
        { name: "Grasas buenas", value: result.grasas_buenas_g || 0, fill: COLORS.green },
        { name: "Grasas malas", value: result.grasas_malas_g || 0, fill: COLORS.red },
        { name: "Azúcares", value: result.azucares_g || 0, fill: COLORS.gold },
        { name: "Proteína", value: result.proteina_g || 0, fill: "#5A7A8C" },
        { name: "Carbohidratos", value: result.carbohidratos_g || 0, fill: "#8C7A5A" },
      ]
    : [];

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: COLORS.paper,
        minHeight: "600px",
        padding: "0",
        color: COLORS.ink,
      }}
    >
      <style>{fontImport}</style>

      {/* Header */}
      <div
        style={{
          background: COLORS.ink,
          color: COLORS.paper,
          padding: "20px 24px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "22px" }}>
          NutriScan
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", opacity: 0.75 }}>
          {stage === "app" ? email : "no verificado"}
        </span>
      </div>

      <div style={{ padding: "28px 24px 40px" }}>
        {stage !== "app" && (
          <div
            style={{
              maxWidth: "380px",
              margin: "20px auto",
              background: COLORS.card,
              border: `1px solid ${COLORS.sage}`,
              borderRadius: "4px",
              padding: "28px 24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
                fontSize: "19px",
                margin: "0 0 6px",
              }}
            >
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h2>
            <p style={{ fontSize: "13px", color: COLORS.sageText, margin: "0 0 16px", lineHeight: 1.5 }}>
              Usuario y contraseña, más verificación por Gmail. Esta demo simula el envío
              del código en pantalla — una integración real necesitaría un backend con
              hash de contraseñas, OAuth de Google y un servicio de correo.
            </p>

            {stage === "email" && (
              <div
                style={{
                  display: "flex",
                  marginBottom: "18px",
                  border: `1px solid ${COLORS.sage}`,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => switchMode("login")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: mode === "login" ? COLORS.ink : "transparent",
                    color: mode === "login" ? COLORS.paper : COLORS.sageText,
                  }}
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => switchMode("signup")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: mode === "signup" ? COLORS.ink : "transparent",
                    color: mode === "signup" ? COLORS.paper : COLORS.sageText,
                  }}
                >
                  Crear cuenta
                </button>
              </div>
            )}

            {stage === "email" && (
              <>
                <label style={{ fontSize: "12px", color: COLORS.sageText, display: "block", marginBottom: "6px" }}>
                  Usuario (correo de Gmail)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@gmail.com"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: `1px solid ${COLORS.sage}`,
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: "12px",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
                <label style={{ fontSize: "12px", color: COLORS.sageText, display: "block", marginBottom: "6px" }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: `1px solid ${COLORS.sage}`,
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: mode === "signup" ? "12px" : "14px",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
                {mode === "signup" && (
                  <>
                    <label style={{ fontSize: "12px", color: COLORS.sageText, display: "block", marginBottom: "6px" }}>
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 12px",
                        border: `1px solid ${COLORS.sage}`,
                        borderRadius: "4px",
                        fontSize: "14px",
                        marginBottom: "14px",
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}
                    />
                  </>
                )}
                <button
                  onClick={handleSendCode}
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: COLORS.green,
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {mode === "login" ? "Continuar" : "Crear cuenta y enviar código"}
                </button>
              </>
            )}

            {stage === "code" && (
              <>
                <div
                  style={{
                    background: COLORS.paper,
                    border: `1px dashed ${COLORS.sage}`,
                    borderRadius: "4px",
                    padding: "10px 12px",
                    marginBottom: "14px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  Código de demo (simula el correo): <strong>{sentCode}</strong>
                </div>
                <label style={{ fontSize: "12px", color: COLORS.sageText, display: "block", marginBottom: "6px" }}>
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="6 dígitos"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: `1px solid ${COLORS.sage}`,
                    borderRadius: "4px",
                    fontSize: "14px",
                    marginBottom: "14px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: "2px",
                  }}
                />
                <button
                  onClick={handleVerifyCode}
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: COLORS.green,
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    marginBottom: "8px",
                  }}
                >
                  Verificar
                </button>
                <button
                  onClick={() => {
                    setStage("email");
                    setCodeInput("");
                  }}
                  style={{
                    width: "100%",
                    padding: "9px",
                    background: "transparent",
                    color: COLORS.sageText,
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Volver
                </button>
              </>
            )}
            {authError && (
              <p style={{ color: COLORS.red, fontSize: "12px", marginTop: "10px" }}>{authError}</p>
            )}
          </div>
        )}

        {stage === "app" && (
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            {/* Scan area */}
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.sage}`,
                borderRadius: "4px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                  fontSize: "17px",
                  margin: "0 0 14px",
                }}
              >
                Escanear alimento
              </h3>

              {!imageData && (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1.5px dashed ${COLORS.sage}`,
                    borderRadius: "4px",
                    padding: "36px 16px",
                    cursor: "pointer",
                    color: COLORS.sageText,
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  Toca para tomar una foto o subir una imagen del plato
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFile}
                    style={{ display: "none" }}
                  />
                </label>
              )}

              {imageData && (
                <div>
                  <img
                    src={imageData}
                    alt="Alimento a analizar"
                    style={{ width: "100%", borderRadius: "4px", marginBottom: "12px", maxHeight: "260px", objectFit: "cover" }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      style={{
                        flex: 1,
                        padding: "11px",
                        background: COLORS.green,
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: analyzing ? "default" : "pointer",
                        opacity: analyzing ? 0.7 : 1,
                      }}
                    >
                      {analyzing ? "Analizando…" : "Analizar alimento"}
                    </button>
                    <button
                      onClick={reset}
                      style={{
                        padding: "11px 16px",
                        background: "transparent",
                        color: COLORS.sageText,
                        border: `1px solid ${COLORS.sage}`,
                        borderRadius: "4px",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Otra foto
                    </button>
                  </div>
                </div>
              )}
              {scanError && <p style={{ color: COLORS.red, fontSize: "13px", marginTop: "10px" }}>{scanError}</p>}
            </div>

            {/* Receipt result */}
            {result && (
              <div
                style={{
                  background: COLORS.card,
                  border: `1px dashed ${COLORS.sage}`,
                  borderRadius: "4px",
                  padding: "22px 22px 8px",
                  marginBottom: "24px",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "14px" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 600 }}>
                    {result.alimento}
                  </div>
                  <div style={{ fontSize: "11px", color: COLORS.sageText }}>
                    porción estimada · {result.porcion_g} g
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    alignItems: "baseline",
                    marginBottom: "18px",
                  }}
                >
                  <span style={{ fontSize: "30px", fontWeight: 500 }}>{Math.round(result.calorias)}</span>
                  <span style={{ fontSize: "12px", color: COLORS.sageText }}>kcal</span>
                </div>

                <div style={{ height: "220px", marginBottom: "6px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke={COLORS.sage} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: COLORS.sageText, fontFamily: "IBM Plex Mono" }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fontSize: 10, fill: COLORS.sageText }} unit="g" />
                      <Tooltip
                        contentStyle={{
                          fontFamily: "IBM Plex Mono",
                          fontSize: "12px",
                          border: `1px solid ${COLORS.sage}`,
                        }}
                        formatter={(v) => [`${v} g`, ""]}
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      background:
                        result.nivel_azucar === "alto"
                          ? "#F5E0D8"
                          : result.nivel_azucar === "medio"
                          ? "#FBEECB"
                          : "#E4EEDD",
                      color:
                        result.nivel_azucar === "alto"
                          ? COLORS.red
                          : result.nivel_azucar === "medio"
                          ? COLORS.gold
                          : COLORS.greenDark,
                    }}
                  >
                    azúcar {result.nivel_azucar}
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "12.5px",
                    lineHeight: 1.6,
                    color: COLORS.ink,
                    borderTop: `1px dashed ${COLORS.sage}`,
                    paddingTop: "12px",
                    marginBottom: "16px",
                  }}
                >
                  {result.comentario}
                </p>

                <div
                  style={{
                    height: "10px",
                    background: `repeating-linear-gradient(90deg, transparent, transparent 6px, ${COLORS.paper} 6px, ${COLORS.paper} 12px)`,
                  }}
                />
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <h3
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    margin: "0 0 10px",
                    color: COLORS.sageText,
                  }}
                >
                  Historial
                </h3>
                {history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: `1px solid ${COLORS.sage}`,
                      fontSize: "13px",
                    }}
                  >
                    <span>{h.alimento}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.sageText }}>
                      {Math.round(h.calorias)} kcal
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
