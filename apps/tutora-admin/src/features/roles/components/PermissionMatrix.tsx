import { Check, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { USER_ROLES } from '@shared/rbac';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui';

import { permissionLabelKey, permissionRows } from '../permissions';

/**
 * Read-only role → permission matrix (issue #69). Renders the client RBAC model
 * from `@shared/rbac`: each admin permission as a row, each role as a column,
 * with a check where the role holds the permission.
 */
export function PermissionMatrix() {
  const { t } = useTranslation();
  const rows = permissionRows();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('rbac.matrix.permission')}</TableHead>
            {USER_ROLES.map((role) => (
              <TableHead key={role} className="text-center">
                {t(`roles.${role}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ permission, grants }) => (
            <TableRow key={permission}>
              <TableCell className="font-medium text-foreground">
                {t(permissionLabelKey(permission))}
              </TableCell>
              {USER_ROLES.map((role) => (
                <TableCell key={role} className="text-center">
                  {grants[role] ? (
                    <>
                      <Check className="mx-auto size-4 text-success" aria-hidden="true" />
                      <span className="sr-only">{t('common.yes')}</span>
                    </>
                  ) : (
                    <>
                      <Minus
                        className="mx-auto size-4 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{t('common.no')}</span>
                    </>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
