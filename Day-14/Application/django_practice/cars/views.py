import csv
from django.http import HttpResponse
from django.db import models
from django.db.models import Avg, Count, Max, Min, Sum
from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator
from .models import CarSale

def dashboard(request):
    total_sales = CarSale.objects.count()
    
    # Aggregated metrics
    stats = CarSale.objects.aggregate(
        avg_price=Avg('sellingprice'),
        total_volume=Sum('sellingprice'),
        avg_condition=Avg('condition'),
        avg_odometer=Avg('odometer'),
        max_price=Max('sellingprice'),
        min_price=Min('sellingprice'),
        avg_mmr=Avg('mmr')
    )
    
    # Top Makes (Brands)
    top_makes = CarSale.objects.values('make').annotate(
        count=Count('id'),
        avg_price=Avg('sellingprice')
    ).order_by('-count')[:5]
    
    # Transmission distribution
    transmission_stats = CarSale.objects.values('transmission').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # State distribution
    state_stats = CarSale.objects.values('state').annotate(
        count=Count('id')
    ).order_by('-count')[:6]
    
    # Recent Sales
    recent_sales = CarSale.objects.order_by('-saledate', '-id')[:10]
    
    # Odometer vs Price data for scatter plot visualization
    chart_data = CarSale.objects.values('make', 'sellingprice', 'odometer', 'year')[:60]
    
    # Let's count some key brand sales for dashboard bar chart
    brand_counts = CarSale.objects.values('make').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Model distribution for pie/donut chart
    model_counts = CarSale.objects.values('make', 'model').annotate(
        count=Count('id')
    ).order_by('-count')
    
    model_distribution = []
    others_count = 0
    for idx, item in enumerate(model_counts):
        label = f"{item['make']} {item['model']}"
        if idx < 8:
            model_distribution.append({'name': label, 'count': item['count']})
        else:
            others_count += item['count']
    if others_count > 0:
        model_distribution.append({'name': 'Others', 'count': others_count})

    context = {
        'total_sales': total_sales,
        'stats': stats,
        'top_makes': top_makes,
        'transmission_stats': transmission_stats,
        'state_stats': state_stats,
        'recent_sales': recent_sales,
        'chart_data': list(chart_data),
        'brand_counts': list(brand_counts),
        'model_distribution': model_distribution,
    }
    return render(request, 'cars/dashboard.html', context)

def inventory(request):
    queryset = CarSale.objects.all()
    
    # Filters
    make_filter = request.GET.get('make', '')
    model_filter = request.GET.get('model', '')
    year_filter = request.GET.get('year', '')
    transmission_filter = request.GET.get('transmission', '')
    color_filter = request.GET.get('color', '')
    search_query = request.GET.get('search', '')
    sort_by = request.GET.get('sort', '-saledate') # Default sort by saledate desc
    
    search_query = search_query.strip()
    is_vin_search = len(search_query) == 17
    is_index_match = False
    if is_vin_search:
        is_index_match = CarSale.objects.filter(vin__iexact=search_query).exists()

    if make_filter:
        queryset = queryset.filter(make__iexact=make_filter)
    if model_filter:
        queryset = queryset.filter(model__icontains=model_filter)
    if year_filter:
        try:
            queryset = queryset.filter(year=int(year_filter))
        except ValueError:
            pass
    if transmission_filter:
        queryset = queryset.filter(transmission__iexact=transmission_filter)
    if color_filter:
        queryset = queryset.filter(color__iexact=color_filter)
    if search_query:
        queryset = queryset.filter(
            models.Q(vin__icontains=search_query) |
            models.Q(seller__icontains=search_query) |
            models.Q(model__icontains=search_query) |
            models.Q(make__icontains=search_query)
        )
        
    # Sort options
    valid_sorts = ['year', '-year', 'sellingprice', '-sellingprice', 'odometer', '-odometer', 'saledate', '-saledate', 'condition', '-condition']
    if sort_by in valid_sorts:
        queryset = queryset.order_by(sort_by, '-id')
    else:
        queryset = queryset.order_by('-saledate', '-id')
        
    # Distinct option dropdowns
    makes = CarSale.objects.values_list('make', flat=True).distinct().order_by('make')
    years = CarSale.objects.values_list('year', flat=True).distinct().order_by('-year')
    transmissions = CarSale.objects.values_list('transmission', flat=True).distinct().order_by('transmission')
    colors = CarSale.objects.values_list('color', flat=True).distinct().order_by('color')
    
    # Pagination
    paginator = Paginator(queryset, 15) # 15 records per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'makes': makes,
        'years': years,
        'transmissions': [t for t in transmissions if t],
        'colors': [c for c in colors if c],
        'is_vin_search': is_vin_search,
        'is_index_match': is_index_match,
        'filters': {
            'make': make_filter,
            'model': model_filter,
            'year': year_filter,
            'transmission': transmission_filter,
            'color': color_filter,
            'search': search_query,
            'sort': sort_by,
        }
    }
    return render(request, 'cars/inventory.html', context)

def car_detail(request, pk):
    car = get_object_or_404(CarSale, pk=pk)
    
    # Recommendations: Similar cars of same make, excluding current car
    similar_cars = CarSale.objects.filter(make=car.make).exclude(pk=car.pk)[:4]
    if similar_cars.count() < 4:
        # Fill up with other body styles if needed
        similar_cars = (list(similar_cars) + list(CarSale.objects.exclude(pk=car.pk)[:4]))[:4]
        
    context = {
        'car': car,
        'similar_cars': similar_cars,
    }
    return render(request, 'cars/detail.html', context)

def analytics(request):
    # Distinct body styles for the category filter
    body_categories = CarSale.objects.values_list('body', flat=True).distinct().order_by('body')
    body_categories = [b.capitalize() for b in body_categories if b]
    body_categories = sorted(list(set(body_categories))) # unique and sorted

    # Get filter params
    filter_body = request.GET.get('body', 'All')
    start_date = request.GET.get('start_date', '')
    end_date = request.GET.get('end_date', '')
    active_pivot = request.GET.get('pivot', 'brand') # default is brand

    # Filter queryset
    queryset = CarSale.objects.all()
    if filter_body != 'All':
        queryset = queryset.filter(body__iexact=filter_body)
    if start_date:
        queryset = queryset.filter(saledate__gte=start_date)
    if end_date:
        queryset = queryset.filter(saledate__lte=end_date)

    # Convert to list to do processing in Python (highly performant for 500 records)
    records = list(queryset)

    # 1. Brand Pivot
    # Brand (Make), Total Sales Revenue, Average Selling Price, Sales Count
    brand_map = {}
    for r in records:
        make = r.make or 'Unknown'
        if make not in brand_map:
            brand_map[make] = {'make': make, 'rev': 0, 'count': 0}
        brand_map[make]['rev'] += r.sellingprice or 0
        brand_map[make]['count'] += 1
    
    brand_pivot = []
    for make, b in brand_map.items():
        brand_pivot.append({
            'make': make,
            'rev': b['rev'],
            'avg': round(b['rev'] / b['count']) if b['count'] > 0 else 0,
            'count': b['count']
        })
    brand_pivot.sort(key=lambda x: x['rev'], reverse=True)

    # Grand Totals for Brand Pivot
    brand_total_rev = sum(b['rev'] for b in brand_pivot)
    brand_total_count = sum(b['count'] for b in brand_pivot)
    brand_grand_avg = round(brand_total_rev / brand_total_count) if brand_total_count > 0 else 0

    # 2. Model Pivot
    # Brand (Make), Model, Sales Volume
    model_map = {}
    for r in records:
        key = (r.make or 'Unknown', r.model or 'Unknown')
        if key not in model_map:
            model_map[key] = 0
        model_map[key] += 1
    
    model_pivot = []
    for (make, model), count in model_map.items():
        model_pivot.append({
            'make': make,
            'model': model,
            'count': count
        })
    model_pivot.sort(key=lambda x: x['count'], reverse=True)
    model_pivot = model_pivot[:15] # Top 15 like Ibrahim's app
    model_total_count = sum(m['count'] for m in model_pivot)

    # Helper to format month
    m_names = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    }
    def get_year_month_label(date_val):
        if not date_val:
            return 'Unknown'
        month_str = f"{date_val.month:02d}"
        return f"{date_val.year}-{m_names.get(month_str, month_str)}"

    # 3. Monthly Trend Pivot
    # Year-Month, Total Revenue, Count of Cars
    month_map = {}
    for r in records:
        lbl = get_year_month_label(r.saledate)
        if lbl not in month_map:
            month_map[lbl] = {'label': lbl, 'rev': 0, 'count': 0}
        month_map[lbl]['rev'] += r.sellingprice or 0
        month_map[lbl]['count'] += 1
    
    # Sort months chronologically
    order = { '2014-Dec': 1, '2015-Jan': 2, '2015-Feb': 3, '2015-Jul': 4 }
    month_pivot = list(month_map.values())
    month_pivot.sort(key=lambda x: order.get(x['label'], 99))

    month_total_rev = sum(m['rev'] for m in month_pivot)
    month_total_count = sum(m['count'] for m in month_pivot)

    # 4. Weekday Sales Pivot
    # Weekday, Average Price, Count of Cars
    weekday_map = {}
    for r in records:
        day = r.saleday or 'Unknown'
        if day not in weekday_map:
            weekday_map[day] = {'day': day, 'total': 0, 'count': 0}
        weekday_map[day]['total'] += r.sellingprice or 0
        weekday_map[day]['count'] += 1
    
    weekday_pivot = []
    day_order = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 }
    for day, d in weekday_map.items():
        weekday_pivot.append({
            'day': day,
            'avg': round(d['total'] / d['count']) if d['count'] > 0 else 0,
            'count': d['count']
        })
    weekday_pivot.sort(key=lambda x: day_order.get(x['day'], 99))

    weekday_total_rev = sum(w['avg'] * w['count'] for w in weekday_pivot)
    weekday_total_count = sum(w['count'] for w in weekday_pivot)
    weekday_grand_avg = round(weekday_total_rev / weekday_total_count) if weekday_total_count > 0 else 0

    # Handles CSV export request
    export_action = request.GET.get('export', '')
    if export_action == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="pivot_{active_pivot}_report.csv"'
        writer = csv.writer(response)
        
        if active_pivot == 'brand':
            writer.writerow(['Brand (Make)', 'Total Sales Revenue ($)', 'Average Selling Price ($)', 'Sales Count'])
            for r in brand_pivot:
                writer.writerow([r['make'], r['rev'], r['avg'], r['count']])
            writer.writerow(['Grand Total', brand_total_rev, brand_grand_avg, brand_total_count])
            
        elif active_pivot == 'model':
            writer.writerow(['Brand', 'Model', 'Sales Volume'])
            for r in model_pivot:
                writer.writerow([r['make'], r['model'], r['count']])
            writer.writerow(['Top 15 Grand Total', '', model_total_count])
            
        elif active_pivot == 'month':
            writer.writerow(['Year-Month', 'Total Revenue ($)', 'Count of Cars'])
            for r in month_pivot:
                writer.writerow([r['label'], r['rev'], r['count']])
            writer.writerow(['Grand Total', month_total_rev, month_total_count])
            
        elif active_pivot == 'weekday':
            writer.writerow(['Weekday (saleday)', 'Average Price ($)', 'Count of Cars'])
            for r in weekday_pivot:
                writer.writerow([r['day'], r['avg'], r['count']])
            writer.writerow(['Grand Total', weekday_grand_avg, weekday_total_count])
            
        return response

    context = {
        'body_categories': body_categories,
        'filters': {
            'body': filter_body,
            'start_date': start_date,
            'end_date': end_date,
            'pivot': active_pivot,
        },
        'brand_pivot': brand_pivot,
        'brand_total_rev': brand_total_rev,
        'brand_total_count': brand_total_count,
        'brand_grand_avg': brand_grand_avg,
        
        'model_pivot': model_pivot,
        'model_total_count': model_total_count,
        
        'month_pivot': month_pivot,
        'month_total_rev': month_total_rev,
        'month_total_count': month_total_count,
        
        'weekday_pivot': weekday_pivot,
        'weekday_total_count': weekday_total_count,
        'weekday_grand_avg': weekday_grand_avg,
        
        'records_count': len(records),
    }
    return render(request, 'cars/analytics.html', context)
