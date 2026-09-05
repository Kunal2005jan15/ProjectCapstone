Trained live Prophet models get cached here as
`prophet__{shop_id}__{item_id}.joblib`, kept separate from `models_store/`
(the demo pizza/bakery models) so the two never collide.

This directory is populated automatically — either by the nightly job
(`python -m app.modeling.train_live_models`) or on the fly the first time
`/forecast/live` sees an item that newly qualifies for the Prophet tier.
