import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ExternalLink, MessageCircle, Play } from "lucide-react"
import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "Black November PalSys — 1 mês grátis",
  description:
    "Conheça os sistemas selecionados da PalSys disponíveis por um mês gratuitamente durante o Black November.",
}

const whatsappUrl =
  "https://wa.me/5512997952482?text=Ol%C3%A1%21%20Quero%20aproveitar%20o%20Black%20November%20da%20PalSys%20e%20testar%20os%20sistemas%20selecionados%20por%201%20m%C3%AAs."

const sistemas = [
  {
    categoria: "Comunicação",
    nome: "Envio por e-mail",
    descricao: "Envie documentos com mais agilidade e padronização.",
    videoId: "xAvIlFxByP8",
  },
  {
    categoria: "Comunicação",
    nome: "Envio por WhatsApp",
    descricao: "Automatize o envio e reduza tarefas repetitivas.",
    videoId: "lFXViQerYxQ",
  },
  {
    categoria: "FGTS Digital",
    nome: "Guia rápida — FGTS Digital",
    descricao: "Agilize a preparação e a importação das guias.",
    videoId: "SuQao5qEEow",
  },
  {
    categoria: "Organização",
    nome: "Central de Documentos",
    descricao: "Centralize, organize e encontre documentos com facilidade.",
    videoId: "McAZDftTzmM",
  },
  {
    categoria: "PDF Printer",
    nome: "PalSys PDF Printer",
    descricao:
      "Capture relatórios impressos pelo Contmatic, identifique informações e organize os PDFs com o padrão do escritório.",
    videoId: "PwCItzETcg4",
  },
]

export default function BlackNovemberPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink} aria-label="Voltar para o início da PalSys">
            <Image src="/logo-palsys.png" alt="PalSys" width={180} height={50} priority />
          </Link>
          <nav className={styles.nav} aria-label="Navegação da campanha">
            <a href="#sistemas">Sistemas</a>
            <a href="#como-aproveitar">Como aproveitar</a>
            <a className={styles.whatsappButtonSmall} href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>BLACK NOVEMBER PALSYS</span>
            <h1>
              1 mês <em>grátis</em> para ganhar tempo.
            </h1>
            <p>
              Experimente sistemas selecionados da PalSys e automatize tarefas que consomem a rotina do seu
              escritório contábil.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#sistemas">
                Ver demonstrações <ArrowRight size={20} />
              </a>
              <Link className={styles.secondaryButton} href="/">
                Conhecer a PalSys
              </Link>
            </div>
            <small>Oferta válida para os sistemas selecionados. Consulte condições e disponibilidade.</small>
          </div>

          <div className={styles.heroArt} aria-label="Robô PalSys voando">
            <span className={`${styles.spark} ${styles.sparkOne}`} />
            <span className={`${styles.spark} ${styles.sparkTwo}`} />
            <span className={`${styles.spark} ${styles.sparkThree}`} />
            <div className={styles.offerOrb}>
              <strong>1</strong>
              <span>MÊS GRÁTIS</span>
            </div>
            <Image
              className={styles.robot}
              src="/black-november-robot.png"
              alt="Robô mascote da PalSys voando"
              width={560}
              height={560}
              priority
            />
          </div>
        </div>
      </section>

      <section className={styles.systemsSection} id="sistemas">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow}>SISTEMAS SELECIONADOS</span>
          <h2>Veja funcionando antes de testar.</h2>
          <p className={styles.sectionIntro}>
            Cada demonstração mostra como a solução reduz etapas manuais, organiza entregas e devolve tempo ao
            escritório.
          </p>

          <div className={styles.systemGrid}>
            {sistemas.map((sistema, index) => (
              <article className={`${styles.systemCard} ${index === sistemas.length - 1 ? styles.lastCard : ""}`} key={sistema.videoId}>
                <div className={styles.videoFrame}>
                  <iframe
                    src={`https://www.youtube.com/embed/${sistema.videoId}?rel=0`}
                    title={`Demonstração: ${sistema.nome}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className={styles.cardContent}>
                  <span>{sistema.categoria}</span>
                  <h3>{sistema.nome}</h3>
                  <p>{sistema.descricao}</p>
                  <a href={`https://youtu.be/${sistema.videoId}`} target="_blank" rel="noreferrer">
                    <Play size={17} fill="currentColor" /> Assistir no YouTube <ExternalLink size={15} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.stepsSection} id="como-aproveitar">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrow}>COMO APROVEITAR</span>
          <h2>Três passos para começar.</h2>
          <div className={styles.steps}>
            <article>
              <strong>01</strong>
              <CheckCircle2 />
              <h3>Fale com a PalSys</h3>
              <p>Entre em contato pelo WhatsApp e mencione o Black November.</p>
            </article>
            <article>
              <strong>02</strong>
              <CheckCircle2 />
              <h3>Escolha os sistemas</h3>
              <p>Informe quais soluções selecionadas deseja experimentar.</p>
            </article>
            <article>
              <strong>03</strong>
              <CheckCircle2 />
              <h3>Solicite sua licença</h3>
              <p>Receba as orientações para utilizar a licença promocional por um mês.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.cta}>
          <div>
            <span>BLACK NOVEMBER</span>
            <h2>Pronto para poupar tempo?</h2>
            <p>Peça sua licença promocional e conheça, na prática, as automações selecionadas da PalSys.</p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle /> Chamar no WhatsApp <ArrowRight />
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <Image src="/logo-palsys.png" alt="PalSys" width={150} height={42} />
        <div>
          <strong>Tecnologia que trabalha com você.</strong>
          <span>palsys.com.br · (12) 99795-2482</span>
        </div>
      </footer>

      <a className={styles.mobileWhatsapp} href={whatsappUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={20} /> Falar no WhatsApp
      </a>
    </main>
  )
}
