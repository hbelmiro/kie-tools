/*
   Copyright (c) 2017 Ahome' Innovation Technologies. All rights reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

package com.ait.lienzo.client.core.image.filter;

import com.ait.lienzo.client.core.shape.json.IFactory;
import com.ait.lienzo.client.core.shape.json.validators.ValidationContext;
import com.ait.lienzo.client.core.shape.json.validators.ValidationException;
import com.ait.lienzo.shared.core.types.ImageFilterType;
import jsinterop.base.Js;

public class ExposureImageDataFilter extends AbstractValueTableImageDataFilter<ExposureImageDataFilter> {

    private double m_value = Double.NaN;

    private FilterTableArray m_table = null;

    public ExposureImageDataFilter() {
        super(ImageFilterType.ExposureImageDataFilterType, 1);
    }

    public ExposureImageDataFilter(double value) {
        super(ImageFilterType.ExposureImageDataFilterType, value);
    }

    protected ExposureImageDataFilter(Object node, ValidationContext ctx) throws ValidationException {
        super(ImageFilterType.ExposureImageDataFilterType, node, ctx);
    }

    @Override
    public double getMinValue() {
        return 0;
    }

    @Override
    public double getMaxValue() {
        return 5;
    }

    @Override
    public double getRefValue() {
        return 1;
    }

    @Override
    protected final FilterTableArray getTable(double value) {
        if (value != m_value) {
            m_table = getTable_(m_value = value);
        }
        return m_table;
    }

    private final FilterTableArray getTable_(double value) {
        int[] table = new int[256];
        for (int i = 0; i < 256; i++) {
            table[i] = Js.coerceToInt(255 * (1 - Math.exp(-(i / 255) * value)));
        }
        return new FilterTableArray(table);
    }

    @Override
    public IFactory<ExposureImageDataFilter> getFactory() {
        return new ExposureImageDataFilterFactory();
    }

    public static class ExposureImageDataFilterFactory extends ValueTableImageDataFilterFactory<ExposureImageDataFilter> {

        public ExposureImageDataFilterFactory() {
            super(ImageFilterType.ExposureImageDataFilterType);
        }
    }
}
