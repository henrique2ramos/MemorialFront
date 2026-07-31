import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapPin, Quote, Star, User } from 'lucide-react';
import { fetchMemoriais, resolveImageUrl } from '../lib/api';
import styles from './TumuloPage.module.css';

function extractQuadra(loc) {
  const match = loc?.match(/Quadra\s+([A-Za-z0-9]+)/i);
  return match ? match[1].trim().toUpperCase() : null;
}

function extractLote(loc) {
  const match = loc?.match(/Lote\s+([A-Za-z0-9]+)/i);
  return match ? match[1].trim() : null;
}

function normalize(loc) {
  return (loc || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getMemoriaisPorTumulo(memoriais, localizacao) {
  const targetQuadra = extractQuadra(localizacao);
  const targetLote = extractLote(localizacao);

  return (Array.isArray(memoriais) ? memoriais : []).filter((m) => {
    const memQuadra = extractQuadra(m.localizacao);
    if (!memQuadra) return false;

    if (targetQuadra && targetLote) {
      return memQuadra === targetQuadra && extractLote(m.localizacao) === targetLote;
    }
    if (targetQuadra) {
      return memQuadra === targetQuadra;
    }
    return normalize(m.localizacao) === normalize(localizacao);
  });
}

export default function TumuloPage() {
  const { localizacao } = useParams();
  const decoded = (() => {
    try { return decodeURIComponent(localizacao || ''); }
    catch { return localizacao || ''; }
  })();

  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchMemoriais()
      .then((data) => {
        if (isMounted) setPessoas(getMemoriaisPorTumulo(data, decoded));
      })
      .catch((error) => {
        console.error('Erro ao carregar memoriais do túmulo:', error);
        if (isMounted) setPessoas([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [decoded]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.mainSection}>
            <div className={styles.card} style={{ padding: '48px', textAlign: 'center' }}>
              <h2>Carregando...</h2>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (pessoas.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.mainSection}>
            <div className={styles.card} style={{ padding: '48px', textAlign: 'center' }}>
              <MapPin size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <h2>Memorial não encontrado</h2>
              <p style={{ color: '#666', marginTop: '12px' }}>
                Nenhum registro encontrado para <strong>{decoded}</strong>.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <header className={styles.tombHeader}>
          <div className={styles.tombIcon}>
            <MapPin size={28} />
          </div>
          <h1 className={styles.tombTitle}>{decoded}</h1>
          <p className={styles.tombSubtitle}>
            {pessoas.length} pessoa{pessoas.length !== 1 ? 's' : ''} neste lote
          </p>
        </header>

        <div className={styles.grid}>
          {pessoas.map((pessoa) => (
            <Link
              key={pessoa.id}
              to={`/memoriais/${pessoa.id}`}
              className={styles.personCard}
            >
              <div className={styles.personImage}>
                {pessoa.imagem ? (
                  <img src={resolveImageUrl(pessoa.imagem)} alt={pessoa.nome} />
                ) : (
                  <User size={40} className={styles.userIcon} />
                )}
              </div>

              <div className={styles.personInfo}>
                <h2 className={styles.personName}>{pessoa.nome}</h2>

                <div className={styles.personDates}>
                  <span className={styles.dateBlock}>
                    <Star size={14} className={styles.starIcon} />
                    {pessoa.dataNascimento || '—'}
                  </span>
                  <span className={styles.dateDivider}></span>
                  <span className={styles.dateBlock}>
                    <span className={styles.crossIcon}>✝</span>
                    {pessoa.dataMorte || '—'}
                  </span>
                </div>

                <p className={styles.personDesc}>{pessoa.descricao}</p>

                {pessoa.mensagemFamilia && (
                  <blockquote className={styles.tributeBox}>
                    <Quote size={20} className={styles.tributeIcon} />
                    <p>"{pessoa.mensagemFamilia}"</p>
                  </blockquote>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
