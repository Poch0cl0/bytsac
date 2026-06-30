export const formatearPorcentajeRenovacion = (probabilidad) => {
  const valor = Number(probabilidad);

  if (Number.isNaN(valor)) return "-";

  return `${(valor * 100).toFixed(1)}%`;
};

export const obtenerColorNivelRenovacion = (nivel) => {
  if (nivel === "alta") return "green";
  if (nivel === "media") return "orange";

  return "red";
};

export const obtenerEtiquetaNivelRenovacion = (nivel) => {
  if (nivel === "alta") return "Alta";
  if (nivel === "media") return "Media";

  return "Baja";
};

export const mapPredictionsBySubscriptionId = (predictions = []) => {
  return predictions.reduce((acc, item) => {
    acc[item.subscription_id] = item;
    return acc;
  }, {});
};
