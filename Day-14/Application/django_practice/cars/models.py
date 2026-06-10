from django.db import models

class CarSale(models.Model):
    # Django auto-creates an 'id' primary key field, but we can declare it explicitly if needed:
    id = models.AutoField(primary_key=True)
    year = models.IntegerField(null=True, blank=True)
    make = models.CharField(max_length=50, null=True, blank=True)
    model = models.CharField(max_length=100, null=True, blank=True)
    trim = models.CharField(max_length=100, null=True, blank=True)
    body = models.CharField(max_length=50, null=True, blank=True)
    transmission = models.CharField(max_length=20, null=True, blank=True)
    vin = models.CharField(max_length=50, null=True, blank=True)
    state = models.CharField(max_length=10, null=True, blank=True)
    condition = models.FloatField(db_column='condition', null=True, blank=True)
    odometer = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)
    interior = models.CharField(max_length=50, null=True, blank=True)
    seller = models.CharField(max_length=255, null=True, blank=True)
    mmr = models.IntegerField(null=True, blank=True)
    sellingprice = models.IntegerField(null=True, blank=True)
    saledate = models.DateField(null=True, blank=True)
    saleday = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        db_table = 'car_sales'
        verbose_name = 'Car Sale'
        verbose_name_plural = 'Car Sales'

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.vin})"
