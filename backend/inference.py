import pickle

import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.saving import load_model as keras_load_model

import config
from preprocessing import cek_oov_ratio, preprocess
from aspek import detect_aspek, generate_alasan


def load_model_and_tokenizer():

    try:
        model = keras_load_model(config.MODEL_PATH)
    except Exception as e:
        raise RuntimeError(f"Gagal load model: {e}")

    try:
        with open(config.TOKENIZER_PATH, "rb") as f:
            tokenizer = pickle.load(f)
    except Exception as e:
        raise RuntimeError(f"Gagal load tokenizer: {e}")

    return model, tokenizer


def klasifikasi_skor(prediction_row: np.ndarray):
    if prediction_row.shape[0] == 1:
        score_raw = float(prediction_row[0])

        class_idx = 1 if score_raw >= 0.5 else 0
        skor = (
            int(round(score_raw * 100))
            if class_idx == 1
            else int(round((1 - score_raw) * 100))
        )
        return config.LABELS[class_idx], skor

    # Softmax (jika suatu saat model diganti jadi multi-kelas)
    class_idx = int(np.argmax(prediction_row))
    skor = int(round(float(np.max(prediction_row)) * 100))
    return config.LABELS[class_idx], skor


def predict_sentiment(text: str, model, tokenizer):
    cleaned = preprocess(text)

    # --- Validasi OOV: tolak sebelum masuk ke model ---
    oov_ratio = cek_oov_ratio(cleaned, tokenizer)
    if oov_ratio >= config.OOV_THRESHOLD:
        return {
            "sentimen": "TIDAK TERIDENTIFIKASI",
            "skor": 0,
            "aspek": ["lainnya"],
            "alasan": (
                f"{oov_ratio:.0%} kata pada input tidak dikenali oleh model "
                f"(Out-of-Vocabulary). Input tidak diproses lebih lanjut."
            ),
        }

    sequence = tokenizer.texts_to_sequences([cleaned])
    padded = pad_sequences(
        sequence, maxlen=config.MAX_LEN, padding="post", truncating="post"
    )

    prediction = model.predict(padded, verbose=0)
    sentimen, skor = klasifikasi_skor(prediction[0])

    aspek = detect_aspek(text)
    alasan = generate_alasan(sentimen, skor, aspek, oov_ratio)

    return {"sentimen": sentimen, "skor": skor, "aspek": aspek, "alasan": alasan}


def predict_sentiment_batch(texts: list[str], model, tokenizer):
    cleaned_list = [preprocess(t) for t in texts]
    oov_ratios = [cek_oov_ratio(c, tokenizer) for c in cleaned_list]
    valid_idx = [i for i, r in enumerate(oov_ratios) if r < config.OOV_THRESHOLD]

    results: list[dict] = [None] * len(texts)  # type: ignore

    # Isi hasil untuk teks yang ditolak karena OOV
    for i, ratio in enumerate(oov_ratios):
        if ratio >= config.OOV_THRESHOLD:
            results[i] = {
                "sentimen": "TIDAK TERIDENTIFIKASI",
                "skor": 0,
                "aspek": ["lainnya"],
                "alasan": (
                    f"{ratio:.0%} kata pada input tidak dikenali oleh model "
                    f"(Out-of-Vocabulary). Input tidak diproses lebih lanjut."
                ),
            }

    # Inference hanya untuk teks yang valid, dalam satu kali batch call
    if valid_idx:
        valid_cleaned = [cleaned_list[i] for i in valid_idx]
        sequences = tokenizer.texts_to_sequences(valid_cleaned)
        padded = pad_sequences(
            sequences, maxlen=config.MAX_LEN, padding="post", truncating="post"
        )
        predictions = model.predict(padded, verbose=0)

        for local_i, original_i in enumerate(valid_idx):
            sentimen, skor = klasifikasi_skor(predictions[local_i])
            aspek = detect_aspek(texts[original_i])
            alasan = generate_alasan(sentimen, skor, aspek, oov_ratios[original_i])
            results[original_i] = {
                "sentimen": sentimen,
                "skor": skor,
                "aspek": aspek,
                "alasan": alasan,
            }

    return results
