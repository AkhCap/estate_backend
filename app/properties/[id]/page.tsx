<p><strong>Состояние:</strong> {property.property_condition}</p>
<p><strong>Балкон:</strong> {property.has_balcony ? "Есть" : "Нет"}</p>
<p><strong>Вид из окна:</strong> {(property.window_view && Array.isArray(property.window_view)) ? property.window_view.join(", ") : "Не указано"}</p>
<p><strong>Санузел:</strong> {property.bathroom || "Не указано"}</p> 