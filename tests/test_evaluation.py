from scripts.evaluate_labels import accepts


def test_acceptance_requires_correct_values_and_missing_sodium():
    nutrition = dict(item_name='Oats', calories=150, protein=5, carbs=27, fat=3, sodium=None)
    case = {'expected_status': 200, 'expected': nutrition, 'absolute_tolerance': 0.5}
    assert accepts(case, 200, {**nutrition, 'calories': 150.4})
    assert not accepts(case, 200, {**nutrition, 'calories': 155})
    assert not accepts(case, 200, {**nutrition, 'sodium': 0})
    assert not accepts(case, 200, {**nutrition, 'fat': float('nan')})


def test_provider_failure_does_not_pass_rejection_case():
    case = {'expected_status': 422}
    assert accepts(case, 422, {'detail': 'Unreadable'})
    assert not accepts(case, 503, {'detail': 'Quota'})
