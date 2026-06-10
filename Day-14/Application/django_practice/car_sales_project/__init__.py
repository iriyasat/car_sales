import pymysql

pymysql.install_as_MySQLdb()

# Bypass Django's MySQL/MariaDB version check (XAMPP uses MariaDB 10.4.32, Django 6.0+ checks for 10.6+)
from django.db.backends.base.base import BaseDatabaseWrapper
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

# Disable RETURNING syntax which is not supported in MariaDB < 10.5
from django.db.backends.mysql.features import DatabaseFeatures
DatabaseFeatures.can_return_columns_from_insert = property(lambda self: False)
DatabaseFeatures.can_return_rows_from_bulk_insert = property(lambda self: False)
